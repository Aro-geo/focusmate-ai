/*
  # Initial Schema Setup for FocusMate AI

  1. New Tables
    - `users` - User accounts (handled by Supabase Auth)
    - `user_preferences` - User settings and preferences
    - `tasks` - User tasks and todos
    - `focus_sessions` - Pomodoro and focus session tracking
    - `pomodoro_sessions` - Individual pomodoro sessions
    - `journal_entries` - Daily journal and reflection entries
    - `ai_interactions` - AI chat history and interactions
    - `user_analytics` - Daily productivity analytics
    - `user_achievements` - Gamification and achievements

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  default_session_duration integer DEFAULT 25,
  break_duration integer DEFAULT 5,
  long_break_duration integer DEFAULT 15,
  auto_start_sessions boolean DEFAULT false,
  sessions_until_long_break integer DEFAULT 4,
  theme varchar(20) DEFAULT 'light',
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status varchar(50) DEFAULT 'pending',
  priority varchar(50) DEFAULT 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Focus sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration integer, -- in minutes
  session_type varchar(50) DEFAULT 'work',
  completed_at timestamptz,
  notes text,
  mood_before integer CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after integer CHECK (mood_after >= 1 AND mood_after <= 5),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pomodoro sessions table (individual pomodoros within focus sessions)
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  focus_session_id uuid REFERENCES focus_sessions(id) ON DELETE CASCADE,
  session_type varchar(20) DEFAULT 'work',
  duration integer NOT NULL, -- in minutes
  completed boolean DEFAULT false,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  goals text,
  accomplishments text,
  reflections text,
  gratitude text,
  tomorrow_goals text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  context jsonb,
  source varchar(20) DEFAULT 'openai',
  interaction_type varchar(50) DEFAULT 'chat',
  created_at timestamptz DEFAULT now()
);

-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_sessions integer DEFAULT 0,
  completed_sessions integer DEFAULT 0,
  total_focus_time integer DEFAULT 0, -- in minutes
  average_productivity numeric(3,2),
  productivity_score numeric(3,2),
  tasks_completed integer DEFAULT 0,
  tasks_created integer DEFAULT 0,
  mood_average numeric(3,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type varchar(100) NOT NULL,
  achievement_data jsonb,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User preferences policies
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Focus sessions policies
CREATE POLICY "Users can read own focus sessions"
  ON focus_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
  ON focus_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Pomodoro sessions policies
CREATE POLICY "Users can read own pomodoro sessions"
  ON pomodoro_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM focus_sessions 
      WHERE focus_sessions.id = pomodoro_sessions.focus_session_id 
      AND focus_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pomodoro sessions"
  ON pomodoro_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM focus_sessions 
      WHERE focus_sessions.id = pomodoro_sessions.focus_session_id 
      AND focus_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pomodoro sessions"
  ON pomodoro_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM focus_sessions 
      WHERE focus_sessions.id = pomodoro_sessions.focus_session_id 
      AND focus_sessions.user_id = auth.uid()
    )
  );

-- Journal entries policies
CREATE POLICY "Users can read own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI interactions policies
CREATE POLICY "Users can read own AI interactions"
  ON ai_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI interactions"
  ON ai_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User analytics policies
CREATE POLICY "Users can read own analytics"
  ON user_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON user_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON user_analytics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_date ON journal_entries(user_id, date);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id_date ON user_analytics(user_id, date);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_focus_sessions_updated_at BEFORE UPDATE ON focus_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pomodoro_sessions_updated_at BEFORE UPDATE ON pomodoro_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();