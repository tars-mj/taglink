-- migration: initial_taglink_schema
-- purpose: create complete database schema for taglink mvp application
-- affected objects:
--   - tables: links, tags, link_tags, rate_limit_violations
--   - functions: normalize_url, extract_domain, links_before_upsert, tags_before_upsert,
--                check_link_tags_limit, cleanup_old_violations
--   - triggers: links and tags upsert triggers, link_tags limit validation
--   - indexes: full-text search, performance optimization, unique constraints
--   - policies: complete rls for all tables
-- notes:
--   - implements soft delete for links via deleted_at timestamp
--   - enforces maximum 10 tags per link
--   - includes ai processing status tracking
--   - all timestamps use timestamptz (utc)

-- ============================================================================
-- 1. enable required extensions
-- ============================================================================

-- enable uuid generation for primary keys
create extension if not exists "uuid-ossp";

-- enable trigram search for fuzzy text matching
create extension if not exists pg_trgm;

-- ============================================================================
-- 2. create tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 links table - stores user links with ai-generated metadata
-- ----------------------------------------------------------------------------
create table links (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    url varchar(2048) not null,
    normalized_url varchar(2048) not null, -- normalized version for uniqueness checks
    domain varchar(255) not null, -- extracted domain for grouping
    title varchar(500), -- page title from scraping
    ai_description varchar(280), -- ai-generated concise description
    scraped_content varchar(3000), -- scraped page content for ai processing
    rating int check (rating >= 1 and rating <= 5), -- user rating 1-5 stars
    ai_processing_status varchar(20) default 'pending'
        check (ai_processing_status in ('pending', 'processing', 'completed', 'failed')),
    ai_processing_started_at timestamptz, -- when ai processing began
    ai_processing_completed_at timestamptz, -- when ai processing finished
    ai_processing_error varchar(500), -- error message if processing failed
    deleted_at timestamptz, -- soft delete timestamp
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,

    -- ensure url is valid format (must start with http:// or https://)
    constraint url_format_check check (url like 'http%://%')
);

-- add comment for table documentation
comment on table links is 'stores user bookmarked links with ai-enhanced metadata and descriptions';
comment on column links.normalized_url is 'url normalized for uniqueness comparison (lowercase protocol, no trailing slash)';
comment on column links.deleted_at is 'soft delete timestamp - if not null, link is considered deleted';
comment on column links.ai_processing_status is 'tracks ai processing state: pending->processing->completed/failed';

-- ----------------------------------------------------------------------------
-- 2.2 tags table - user-created tags for link categorization
-- ----------------------------------------------------------------------------
create table tags (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(30) not null check (char_length(name) >= 2), -- min 2 chars
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp
);

-- add table documentation
comment on table tags is 'user-created tags for organizing and categorizing links';
comment on column tags.name is 'tag name, stored in lowercase, 2-30 characters';

-- ----------------------------------------------------------------------------
-- 2.3 link_tags junction table - many-to-many relationship
-- ----------------------------------------------------------------------------
create table link_tags (
    link_id uuid not null references links(id) on delete cascade,
    tag_id uuid not null references tags(id) on delete cascade,
    created_at timestamptz default current_timestamp,

    -- composite primary key saves ~20% storage vs separate id column
    primary key (link_id, tag_id)
);

-- add table documentation
comment on table link_tags is 'junction table connecting links to tags (many-to-many)';

-- ----------------------------------------------------------------------------
-- 2.4 rate_limit_violations table - track and monitor rate limit violations
-- ----------------------------------------------------------------------------
create table rate_limit_violations (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    violation_type varchar(50) not null default 'links_per_hour',
    attempted_at timestamptz default current_timestamp,
    details jsonb -- flexible field for additional context
);

-- add table documentation
comment on table rate_limit_violations is 'tracks rate limit violations for monitoring and abuse prevention';
comment on column rate_limit_violations.details is 'json field for flexible violation context (ip, endpoint, etc)';

-- ============================================================================
-- 3. create indexes for performance optimization
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 links table indexes
-- ----------------------------------------------------------------------------

-- unique constraint for url per user (excluding soft-deleted links)
-- prevents duplicate urls for same user
create unique index idx_links_user_url_unique
on links(user_id, normalized_url)
where deleted_at is null;

-- composite index for common sorting pattern: by rating and date
-- optimizes queries that sort by rating (highest first) then by date
create index idx_links_user_rating_created
on links(user_id, rating desc nulls last, created_at desc)
where deleted_at is null;

-- gin index for full-text search on title
-- enables fast fuzzy search with % wildcard patterns
create index idx_links_title_gin
on links using gin (title gin_trgm_ops)
where deleted_at is null;

-- gin index for full-text search on ai description
-- enables fast fuzzy search on ai-generated descriptions
create index idx_links_description_gin
on links using gin (ai_description gin_trgm_ops)
where deleted_at is null;

-- domain index for future grouping features
-- enables fast queries by domain (e.g., all links from github.com)
create index idx_links_user_domain
on links(user_id, domain)
where deleted_at is null;

-- ai processing status index for queue management
-- efficiently finds links pending or being processed
create index idx_links_ai_status
on links(ai_processing_status)
where deleted_at is null and ai_processing_status in ('pending', 'processing');

-- ----------------------------------------------------------------------------
-- 3.2 tags table indexes
-- ----------------------------------------------------------------------------

-- case-insensitive unique constraint for tag names per user
-- prevents duplicate tags with different casing
create unique index idx_tags_user_name_unique
on tags(user_id, lower(name));

-- quick tag lookup by user
-- optimizes fetching all tags for a user
create index idx_tags_user_id
on tags(user_id);

-- ----------------------------------------------------------------------------
-- 3.3 link_tags table indexes
-- ----------------------------------------------------------------------------

-- reverse lookup index for finding all links with specific tag
create index idx_link_tags_tag_id
on link_tags(tag_id);

-- ----------------------------------------------------------------------------
-- 3.4 rate_limit_violations indexes
-- ----------------------------------------------------------------------------

-- index for querying recent violations by user
-- optimizes rate limit checking queries
create index idx_rate_violations_user_time
on rate_limit_violations(user_id, attempted_at desc);

-- ============================================================================
-- 4. create functions for data processing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 url normalization function
-- ----------------------------------------------------------------------------
create or replace function normalize_url(input_url text)
returns text as $$
declare
    parsed_url text;
begin
    -- convert protocol to lowercase (HTTP:// -> http://)
    parsed_url := regexp_replace(input_url, '^(https?)', lower('\1'), 'i');

    -- remove trailing slash from path (but keep domain-only urls intact)
    -- example: https://example.com/path/ -> https://example.com/path
    -- but: https://example.com/ stays as is
    if parsed_url ~ '^https?://[^/]+/.*/$' then
        parsed_url := rtrim(parsed_url, '/');
    end if;

    return parsed_url;
end;
$$ language plpgsql immutable;

comment on function normalize_url is 'normalizes urls for consistent storage and uniqueness checking';

-- ----------------------------------------------------------------------------
-- 4.2 domain extraction function
-- ----------------------------------------------------------------------------
create or replace function extract_domain(input_url text)
returns text as $$
begin
    -- extract domain from url using regex
    -- captures everything between protocol and first slash/colon/question mark
    return (regexp_match(input_url, '^https?://([^/:?]+)', 'i'))[1];
end;
$$ language plpgsql immutable;

comment on function extract_domain is 'extracts domain name from url for grouping and filtering';

-- ----------------------------------------------------------------------------
-- 4.3 links before insert/update trigger function
-- ----------------------------------------------------------------------------
create or replace function links_before_upsert()
returns trigger as $$
begin
    -- normalize url for consistency
    new.normalized_url := normalize_url(new.url);

    -- extract domain for grouping
    new.domain := extract_domain(new.url);

    -- always update the updated_at timestamp
    new.updated_at := current_timestamp;

    -- track ai processing timestamps based on status changes
    if old.ai_processing_status is distinct from new.ai_processing_status then
        if new.ai_processing_status = 'processing' then
            -- starting processing
            new.ai_processing_started_at := current_timestamp;
        elsif new.ai_processing_status in ('completed', 'failed') then
            -- finished processing (success or failure)
            new.ai_processing_completed_at := current_timestamp;
        end if;
    end if;

    return new;
end;
$$ language plpgsql;

comment on function links_before_upsert is 'trigger function to normalize urls and track processing timestamps';

-- ----------------------------------------------------------------------------
-- 4.4 tags before insert/update trigger function
-- ----------------------------------------------------------------------------
create or replace function tags_before_upsert()
returns trigger as $$
begin
    -- convert tag name to lowercase for consistency
    new.name := lower(new.name);

    -- update timestamp
    new.updated_at := current_timestamp;

    return new;
end;
$$ language plpgsql;

comment on function tags_before_upsert is 'trigger function to normalize tag names to lowercase';

-- ----------------------------------------------------------------------------
-- 4.5 link tags count validation function
-- ----------------------------------------------------------------------------
create or replace function check_link_tags_limit()
returns trigger as $$
declare
    tag_count int;
begin
    -- count existing tags for this link
    select count(*) into tag_count
    from link_tags
    where link_id = new.link_id;

    -- enforce maximum 10 tags per link
    if tag_count >= 10 then
        raise exception 'link cannot have more than 10 tags';
    end if;

    return new;
end;
$$ language plpgsql;

comment on function check_link_tags_limit is 'enforces maximum 10 tags per link business rule';

-- ----------------------------------------------------------------------------
-- 4.6 rate limit violations cleanup function
-- ----------------------------------------------------------------------------
create or replace function cleanup_old_violations()
returns void as $$
begin
    -- delete violations older than 30 days
    -- keeps table size manageable while preserving recent history
    delete from rate_limit_violations
    where attempted_at < current_timestamp - interval '30 days';
end;
$$ language plpgsql;

comment on function cleanup_old_violations is 'removes rate limit violations older than 30 days';

-- ============================================================================
-- 5. create triggers
-- ============================================================================

-- links table triggers
create trigger trigger_links_before_insert
    before insert on links
    for each row
    execute function links_before_upsert();

create trigger trigger_links_before_update
    before update on links
    for each row
    execute function links_before_upsert();

-- tags table triggers
create trigger trigger_tags_before_insert
    before insert on tags
    for each row
    execute function tags_before_upsert();

create trigger trigger_tags_before_update
    before update on tags
    for each row
    execute function tags_before_upsert();

-- link_tags validation trigger
create trigger trigger_check_link_tags_limit
    before insert on link_tags
    for each row
    execute function check_link_tags_limit();

-- ============================================================================
-- 6. enable row level security (rls) on all tables
-- ============================================================================

-- enable rls on all tables (required for security)
alter table links enable row level security;
alter table tags enable row level security;
alter table link_tags enable row level security;
alter table rate_limit_violations enable row level security;

-- ============================================================================
-- 7. create rls policies for links table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 links policies for authenticated users
-- ----------------------------------------------------------------------------

-- select policy: users can only view their own links
create policy "authenticated users can select own links"
on links for select
to authenticated
using (auth.uid() = user_id);

-- insert policy: users can only create links for themselves
create policy "authenticated users can insert own links"
on links for insert
to authenticated
with check (auth.uid() = user_id);

-- update policy: users can only update their own links
create policy "authenticated users can update own links"
on links for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- delete policy: users can only delete their own links (soft delete via update)
create policy "authenticated users can delete own links"
on links for delete
to authenticated
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7.2 links policies for anonymous users (no access)
-- ----------------------------------------------------------------------------

-- anonymous users cannot access links at all
-- no policies created = no access

-- ============================================================================
-- 8. create rls policies for tags table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 tags policies for authenticated users
-- ----------------------------------------------------------------------------

-- select policy: users can only view their own tags
create policy "authenticated users can select own tags"
on tags for select
to authenticated
using (auth.uid() = user_id);

-- insert policy: users can only create tags for themselves
create policy "authenticated users can insert own tags"
on tags for insert
to authenticated
with check (auth.uid() = user_id);

-- update policy: users can only update their own tags
create policy "authenticated users can update own tags"
on tags for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- delete policy: users can only delete their own tags
create policy "authenticated users can delete own tags"
on tags for delete
to authenticated
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8.2 tags policies for anonymous users (no access)
-- ----------------------------------------------------------------------------

-- anonymous users cannot access tags at all
-- no policies created = no access

-- ============================================================================
-- 9. create rls policies for link_tags table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1 link_tags policies for authenticated users
-- ----------------------------------------------------------------------------

-- select policy: users can view link-tag associations for their links
create policy "authenticated users can select own link_tags"
on link_tags for select
to authenticated
using (
    exists (
        select 1 from links
        where links.id = link_tags.link_id
        and links.user_id = auth.uid()
    )
);

-- insert policy: users can create associations for their links and tags
create policy "authenticated users can insert own link_tags"
on link_tags for insert
to authenticated
with check (
    -- verify user owns the link
    exists (
        select 1 from links
        where links.id = link_tags.link_id
        and links.user_id = auth.uid()
    )
    and
    -- verify user owns the tag
    exists (
        select 1 from tags
        where tags.id = link_tags.tag_id
        and tags.user_id = auth.uid()
    )
);

-- update policy: link_tags should not be updated (immutable relationship)
-- no update policy created

-- delete policy: users can remove associations for their links
create policy "authenticated users can delete own link_tags"
on link_tags for delete
to authenticated
using (
    exists (
        select 1 from links
        where links.id = link_tags.link_id
        and links.user_id = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 9.2 link_tags policies for anonymous users (no access)
-- ----------------------------------------------------------------------------

-- anonymous users cannot access link_tags at all
-- no policies created = no access

-- ============================================================================
-- 10. create rls policies for rate_limit_violations table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10.1 rate_limit_violations policies for authenticated users
-- ----------------------------------------------------------------------------

-- select policy: users can view their own violations (for transparency)
create policy "authenticated users can select own violations"
on rate_limit_violations for select
to authenticated
using (auth.uid() = user_id);

-- insert/update/delete: only service role can modify (system-managed table)
-- users cannot insert, update, or delete violations directly

-- ----------------------------------------------------------------------------
-- 10.2 rate_limit_violations policies for service role
-- ----------------------------------------------------------------------------

-- service role has full access (for system operations)
create policy "service role has full access to violations"
on rate_limit_violations for all
to service_role
using (true)
with check (true);

-- ----------------------------------------------------------------------------
-- 10.3 rate_limit_violations policies for anonymous users (no access)
-- ----------------------------------------------------------------------------

-- anonymous users cannot access violations at all
-- no policies created = no access

-- ============================================================================
-- 11. grant necessary permissions
-- ============================================================================

-- grant usage on schema to authenticated and anon roles
grant usage on schema public to anon, authenticated;

-- grant table permissions to authenticated users
grant select, insert, update, delete on links to authenticated;
grant select, insert, update, delete on tags to authenticated;
grant select, insert, delete on link_tags to authenticated; -- no update
grant select on rate_limit_violations to authenticated; -- read-only

-- service role needs full access to rate_limit_violations
grant all on rate_limit_violations to service_role;

-- grant sequence permissions for id generation
grant usage, select on all sequences in schema public to anon, authenticated;

-- ============================================================================
-- 12. add helpful comments for documentation
-- ============================================================================

comment on schema public is 'taglink application schema for intelligent link management';

-- migration complete
-- this schema provides:
-- - complete data isolation between users via rls
-- - soft delete capability for links
-- - ai processing status tracking
-- - rate limiting violation tracking
-- - full-text search on titles and descriptions
-- - maximum 10 tags per link enforcement
-- - automatic url normalization and domain extraction