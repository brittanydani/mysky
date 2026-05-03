-- Scope Inner World daily reflection row ids by user.
--
-- Older clients used ids shaped like date:question_id:category, which can
-- collide across accounts because id is the table primary key. New clients
-- write user_id:date:question_id:category. This migration updates existing
-- rows when the scoped target id is available; rows that already have a
-- matching scoped duplicate are left untouched for the client compatibility
-- lookup path.

UPDATE public.daily_reflections AS reflection
SET id = reflection.user_id::text || ':' || reflection.id
WHERE reflection.id NOT LIKE reflection.user_id::text || ':%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.daily_reflections AS existing
    WHERE existing.id = reflection.user_id::text || ':' || reflection.id
  );
