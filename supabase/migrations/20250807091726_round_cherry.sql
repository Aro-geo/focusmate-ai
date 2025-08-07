-- Seed data for FocusMate AI
-- This file contains sample data for testing and development

-- Note: This seed data will only work after users have been created through Supabase Auth
-- Replace the user_id values with actual UUIDs from your auth.users table

-- Sample user preferences (replace with actual user UUID)
-- INSERT INTO user_preferences (user_id, default_session_duration, break_duration, long_break_duration)
-- VALUES ('00000000-0000-0000-0000-000000000000', 25, 5, 15);

-- Sample tasks (replace with actual user UUID)
-- INSERT INTO tasks (user_id, title, description, priority, status) VALUES
-- ('00000000-0000-0000-0000-000000000000', 'Complete project proposal', 'Write and review the Q1 project proposal', 'high', 'pending'),
-- ('00000000-0000-0000-0000-000000000000', 'Review team feedback', 'Go through feedback from last sprint', 'medium', 'pending'),
-- ('00000000-0000-0000-0000-000000000000', 'Update documentation', 'Update API documentation with new endpoints', 'low', 'completed');

-- Sample journal entry (replace with actual user UUID)
-- INSERT INTO journal_entries (user_id, date, mood_rating, productivity_rating, goals, accomplishments, reflections)
-- VALUES ('00000000-0000-0000-0000-000000000000', CURRENT_DATE, 4, 4, 'Focus on deep work', 'Completed 3 pomodoro sessions', 'Good focus today, minimal distractions');

-- Achievement types that can be earned
INSERT INTO user_achievements (user_id, achievement_type, achievement_data) VALUES
-- These will be created dynamically when users earn achievements
-- Examples:
-- ('user-uuid', 'first_session', '{"description": "Completed your first focus session!", "icon": "🎯"}'),
-- ('user-uuid', 'streak_7', '{"description": "7-day focus streak!", "icon": "🔥"}'),
-- ('user-uuid', 'early_bird', '{"description": "Started a session before 8 AM", "icon": "🌅"}');

-- Note: To use this seed data:
-- 1. Create a user account through your app
-- 2. Get the user UUID from the Supabase dashboard (auth.users table)
-- 3. Replace the placeholder UUIDs above with the actual user UUID
-- 4. Run the INSERT statements in the Supabase SQL editor