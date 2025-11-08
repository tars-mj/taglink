# Database Schema - TagLink

## 1. Tables Definition

### 1.1 links
Stores user links with AI-generated descriptions and metadata.

```sql
CREATE TABLE links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    normalized_url VARCHAR(2048) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    ai_description VARCHAR(280),
    scraped_content VARCHAR(3000),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    ai_processing_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_processing_started_at TIMESTAMPTZ,
    ai_processing_completed_at TIMESTAMPTZ,
    ai_processing_error VARCHAR(500),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT url_format_check CHECK (url LIKE 'http%://%')
);
```

### 1.2 tags
Stores user-created tags for link categorization.

```sql
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL CHECK (char_length(name) >= 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 link_tags
Junction table for many-to-many relationship between links and tags.

```sql
CREATE TABLE link_tags (
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (link_id, tag_id)
);
```

### 1.4 rate_limit_violations
Tracks rate limit violations for monitoring and abuse prevention.

```sql
CREATE TABLE rate_limit_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL DEFAULT 'links_per_hour',
    attempted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);
```

## 2. Relationships

### 2.1 Primary Relationships
- **users → links** (1:N): One user can have many links
- **users → tags** (1:N): One user can have many tags
- **links ↔ tags** (M:N): Many-to-many through link_tags junction table

### 2.2 Constraints
- Maximum 10 tags per link (enforced at application level)
- Minimum 0 tags per link (no minimum requirement)
- Each user has isolated data space (enforced via RLS)

## 3. Indexes

### 3.1 Primary Indexes
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Unique constraint for URL per user (excluding soft-deleted)
CREATE UNIQUE INDEX idx_links_user_url_unique
ON links(user_id, normalized_url)
WHERE deleted_at IS NULL;

-- Composite index for sorting by rating and date
CREATE INDEX idx_links_user_rating_created
ON links(user_id, rating DESC NULLS LAST, created_at DESC)
WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX idx_links_title_gin
ON links USING GIN (title gin_trgm_ops)
WHERE deleted_at IS NULL;

CREATE INDEX idx_links_description_gin
ON links USING GIN (ai_description gin_trgm_ops)
WHERE deleted_at IS NULL;

-- Domain index for future grouping features
CREATE INDEX idx_links_user_domain
ON links(user_id, domain)
WHERE deleted_at IS NULL;

-- AI processing status for queue management
CREATE INDEX idx_links_ai_status
ON links(ai_processing_status)
WHERE deleted_at IS NULL AND ai_processing_status IN ('pending', 'processing');
```

### 3.2 Tags Indexes
```sql
-- Case-insensitive unique constraint for tag names per user
CREATE UNIQUE INDEX idx_tags_user_name_unique
ON tags(user_id, LOWER(name));

-- Quick tag lookup by user
CREATE INDEX idx_tags_user_id
ON tags(user_id);
```

### 3.3 Link_Tags Indexes
```sql
-- Reverse lookup index
CREATE INDEX idx_link_tags_tag_id
ON link_tags(tag_id);
```

### 3.4 Rate Limiting Indexes
```sql
-- Index for querying recent violations
CREATE INDEX idx_rate_violations_user_time
ON rate_limit_violations(user_id, attempted_at DESC);
```

## 4. Row Level Security (RLS) Policies

### 4.1 Enable RLS
```sql
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;
```

### 4.2 Links Policies
```sql
-- Users can only see their own links
CREATE POLICY "Users can view own links" ON links
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own links
CREATE POLICY "Users can insert own links" ON links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own links
CREATE POLICY "Users can update own links" ON links
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own links (soft delete)
CREATE POLICY "Users can delete own links" ON links
    FOR DELETE USING (auth.uid() = user_id);
```

### 4.3 Tags Policies
```sql
-- Users can only see their own tags
CREATE POLICY "Users can view own tags" ON tags
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create their own tags
CREATE POLICY "Users can insert own tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tags
CREATE POLICY "Users can update own tags" ON tags
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tags
CREATE POLICY "Users can delete own tags" ON tags
    FOR DELETE USING (auth.uid() = user_id);
```

### 4.4 Link_Tags Policies
```sql
-- Users can only see link-tag associations for their links
CREATE POLICY "Users can view own link_tags" ON link_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM links
            WHERE links.id = link_tags.link_id
            AND links.user_id = auth.uid()
        )
    );

-- Users can only create associations for their links and tags
CREATE POLICY "Users can insert own link_tags" ON link_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM links
            WHERE links.id = link_tags.link_id
            AND links.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM tags
            WHERE tags.id = link_tags.tag_id
            AND tags.user_id = auth.uid()
        )
    );

-- Users can only delete associations for their links
CREATE POLICY "Users can delete own link_tags" ON link_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM links
            WHERE links.id = link_tags.link_id
            AND links.user_id = auth.uid()
        )
    );
```

### 4.5 Rate Limit Violations Policies
```sql
-- Users can only see their own violations
CREATE POLICY "Users can view own violations" ON rate_limit_violations
    FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert violations (via service role)
CREATE POLICY "System can insert violations" ON rate_limit_violations
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

## 5. Triggers and Functions

### 5.1 URL Normalization Function
```sql
CREATE OR REPLACE FUNCTION normalize_url(input_url TEXT)
RETURNS TEXT AS $$
DECLARE
    parsed_url TEXT;
BEGIN
    -- Convert protocol to lowercase
    parsed_url := regexp_replace(input_url, '^(https?)', lower('\1'), 'i');

    -- Remove trailing slash from path (but not from domain)
    IF parsed_url ~ '^https?://[^/]+/.*/$' THEN
        parsed_url := rtrim(parsed_url, '/');
    END IF;

    RETURN parsed_url;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 5.2 Domain Extraction Function
```sql
CREATE OR REPLACE FUNCTION extract_domain(input_url TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (regexp_match(input_url, '^https?://([^/]+)', 'i'))[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 5.3 Links Before Insert/Update Trigger
```sql
CREATE OR REPLACE FUNCTION links_before_upsert()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize URL
    NEW.normalized_url := normalize_url(NEW.url);

    -- Extract domain
    NEW.domain := extract_domain(NEW.url);

    -- Update timestamps
    NEW.updated_at := CURRENT_TIMESTAMP;

    -- Set AI processing timestamp if status changes
    IF OLD.ai_processing_status IS DISTINCT FROM NEW.ai_processing_status THEN
        IF NEW.ai_processing_status = 'processing' THEN
            NEW.ai_processing_started_at := CURRENT_TIMESTAMP;
        ELSIF NEW.ai_processing_status IN ('completed', 'failed') THEN
            NEW.ai_processing_completed_at := CURRENT_TIMESTAMP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_links_before_insert
    BEFORE INSERT ON links
    FOR EACH ROW
    EXECUTE FUNCTION links_before_upsert();

CREATE TRIGGER trigger_links_before_update
    BEFORE UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION links_before_upsert();
```

### 5.4 Tags Before Insert/Update Trigger
```sql
CREATE OR REPLACE FUNCTION tags_before_upsert()
RETURNS TRIGGER AS $$
BEGIN
    -- Convert name to lowercase
    NEW.name := LOWER(NEW.name);

    -- Update timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tags_before_insert
    BEFORE INSERT ON tags
    FOR EACH ROW
    EXECUTE FUNCTION tags_before_upsert();

CREATE TRIGGER trigger_tags_before_update
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION tags_before_upsert();
```

### 5.5 Link Tags Count Validation
```sql
CREATE OR REPLACE FUNCTION check_link_tags_limit()
RETURNS TRIGGER AS $$
DECLARE
    tag_count INT;
BEGIN
    SELECT COUNT(*) INTO tag_count
    FROM link_tags
    WHERE link_id = NEW.link_id;

    IF tag_count >= 10 THEN
        RAISE EXCEPTION 'Link cannot have more than 10 tags';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_link_tags_limit
    BEFORE INSERT ON link_tags
    FOR EACH ROW
    EXECUTE FUNCTION check_link_tags_limit();
```

### 5.6 Rate Limit Violations Cleanup
```sql
-- Function to clean old violations (30 days retention)
CREATE OR REPLACE FUNCTION cleanup_old_violations()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_violations
    WHERE attempted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic cleanup (requires pg_cron extension or external scheduler)
-- Example with pg_cron:
-- SELECT cron.schedule('cleanup-violations', '0 2 * * *', 'SELECT cleanup_old_violations();');
```

## 6. Additional Notes

### 6.1 Design Decisions
1. **Soft Delete for Links**: Implemented via `deleted_at` timestamp to preserve data integrity and allow recovery
2. **Hard Delete for Tags**: Direct deletion as tags are simple entities without historical value
3. **URL Normalization**: Handled at database level via triggers for consistency
4. **Domain Extraction**: Automatic extraction for future grouping features
5. **Composite Primary Key**: Used in `link_tags` to save ~20% storage space
6. **TIMESTAMPTZ**: All timestamps use timezone-aware format stored in UTC
7. **No Audit Log**: Excluded from MVP to reduce complexity
8. **No Usage Count**: Tag usage frequency calculated dynamically when needed

### 6.2 Performance Considerations
1. **GIN Indexes**: Optimized for real-time full-text search with debounce
2. **Composite Index**: Single index handles both rating and date sorting
3. **Partial Indexes**: Exclude soft-deleted records for better performance
4. **VARCHAR Limits**: Enforced at database level for data integrity

### 6.3 Security Features
1. **RLS Policies**: Complete data isolation between users
2. **Service Role**: Required for system operations like rate limit tracking
3. **Input Validation**: CHECK constraints for URLs and data formats
4. **Cascade Deletes**: Automatic cleanup of related records

### 6.4 Scalability Provisions
1. **UUID Primary Keys**: Support for distributed systems
2. **Index Strategy**: Balanced between write and read performance
3. **Trigger Functions**: Immutable where possible for optimization
4. **Cleanup Functions**: Automated maintenance for rate limit table