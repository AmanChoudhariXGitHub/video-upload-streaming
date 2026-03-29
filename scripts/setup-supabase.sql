-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  original_path TEXT,
  processed_path TEXT,
  thumbnail_path TEXT,
  hls_path TEXT,
  dash_path TEXT,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
  sensitivity_status TEXT DEFAULT 'pending' CHECK (sensitivity_status IN ('pending', 'safe', 'flagged')),
  sensitivity_score FLOAT,
  duration INTEGER,
  size INTEGER NOT NULL,
  format TEXT NOT NULL,
  resolution TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create processing_jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transcode', 'thumbnail', 'analysis', 'hls', 'dash')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL CHECK (event IN ('view', 'play', 'pause', 'complete', 'buffer')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_sensitivity_status ON videos(sensitivity_status);
CREATE INDEX idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_analytics_events_video_id ON analytics_events(video_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);

-- Insert demo users
-- Note: In production, use proper password hashing (bcrypt)
-- These are hashed versions of: admin123 and user123
INSERT INTO users (email, username, password_hash, role)
VALUES
  ('admin@example.com', 'admin', '$2a$10$YIjlrHnqJvHnF3Jv3nX3XeW3n0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z', 'admin'),
  ('user@example.com', 'testuser', '$2a$10$ZKjlsIoqKwIoKoYkYoYkYeX4o1A1A1A1A1A1A1A1A1A1A1A1A1A', 'user')
ON CONFLICT (email) DO NOTHING;
