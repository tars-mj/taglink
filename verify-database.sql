-- Skrypt weryfikacyjny - możesz go też uruchomić w SQL Editor
-- aby sprawdzić czy wszystko zostało utworzone poprawnie

-- 1. Sprawdź czy tabele istnieją
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('links', 'tags', 'link_tags', 'rate_limit_violations')
ORDER BY table_name;

-- 2. Sprawdź RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Sprawdź indexy
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('links', 'tags', 'link_tags', 'rate_limit_violations')
ORDER BY tablename, indexname;

-- 4. Sprawdź triggery
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('links', 'tags', 'link_tags')
ORDER BY table_name, trigger_name;

-- 5. Sprawdź funkcje
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'normalize_url',
    'extract_domain',
    'links_before_upsert',
    'tags_before_upsert',
    'check_link_tags_limit',
    'cleanup_old_violations'
  )
ORDER BY routine_name;
