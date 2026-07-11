PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profile_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK (length(username) BETWEEN 3 AND 24),
  email TEXT COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL
    CHECK (password_iterations BETWEEN 100000 AND 1000000),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 40),
  bio TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 280),
  avatar_character TEXT NOT NULL DEFAULT 'mochi',
  avatar_frame TEXT NOT NULL DEFAULT 'none',
  avatar_background TEXT NOT NULL DEFAULT 'peach-sky',
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  rewards_claimed INTEGER NOT NULL DEFAULT 0 CHECK (rewards_claimed >= 0),
  avatar_changes INTEGER NOT NULL DEFAULT 0 CHECK (avatar_changes >= 0),
  distinct_games INTEGER NOT NULL DEFAULT 0 CHECK (distinct_games >= 0),
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  user_agent_hash TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES profile_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_sessions_user_created
  ON profile_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_sessions_expires
  ON profile_sessions(expires_at);

CREATE TABLE IF NOT EXISTS profile_game_stats (
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL CHECK (length(game_id) BETWEEN 1 AND 80),
  plays INTEGER NOT NULL DEFAULT 0 CHECK (plays >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  last_score INTEGER NOT NULL DEFAULT 0 CHECK (last_score >= 0),
  total_duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_ms >= 0),
  last_played_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, game_id),
  FOREIGN KEY (user_id) REFERENCES profile_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_game_leaderboard
  ON profile_game_stats(game_id, best_score DESC, last_played_at ASC);
CREATE INDEX IF NOT EXISTS idx_profile_game_recent
  ON profile_game_stats(user_id, last_played_at DESC);

CREATE TABLE IF NOT EXISTS profile_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL CHECK (length(event_id) BETWEEN 8 AND 80),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('game', 'reward', 'avatar')),
  game_id TEXT,
  value INTEGER NOT NULL DEFAULT 0,
  detail TEXT NOT NULL DEFAULT '{}',
  processed INTEGER NOT NULL DEFAULT 0 CHECK (processed IN (0, 1)),
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES profile_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_events_user_type_time
  ON profile_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_events_created
  ON profile_events(created_at);

CREATE TABLE IF NOT EXISTS cosmetic_definitions (
  item_type TEXT NOT NULL CHECK (item_type IN ('character', 'frame', 'background')),
  item_key TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_hint TEXT NOT NULL,
  starter INTEGER NOT NULL DEFAULT 0 CHECK (starter IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (item_type, item_key)
);

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('play', 'score', 'victory', 'reward', 'style', 'explore')),
  metric TEXT NOT NULL CHECK (
    metric IN (
      'total_score', 'games_played', 'wins', 'rewards_claimed',
      'avatar_changes', 'distinct_games', 'best_score'
    )
  ),
  threshold INTEGER NOT NULL CHECK (threshold > 0),
  points INTEGER NOT NULL CHECK (points > 0),
  trophy_tier TEXT NOT NULL CHECK (trophy_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  reward_cosmetic_type TEXT,
  reward_cosmetic_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  FOREIGN KEY (reward_cosmetic_type, reward_cosmetic_key)
    REFERENCES cosmetic_definitions(item_type, item_key)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES profile_users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_recent
  ON user_achievements(user_id, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS user_cosmetics (
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (user_id, item_type, item_key),
  FOREIGN KEY (user_id) REFERENCES profile_users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_type, item_key)
    REFERENCES cosmetic_definitions(item_type, item_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user_type
  ON user_cosmetics(user_id, item_type, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS profile_rate_limits (
  rate_key TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL CHECK (hits > 0),
  PRIMARY KEY (rate_key, action)
);

INSERT OR IGNORE INTO cosmetic_definitions
  (item_type, item_key, name, asset_hint, starter, sort_order)
VALUES
  ('character', 'mochi', 'Mochi', '/assets/images/characters/mochi.svg', 1, 10),
  ('character', 'mango', 'Mango', '/assets/images/characters/mango.svg', 1, 20),
  ('character', 'pandy', 'Pandy', '/assets/images/characters/pandy.svg', 1, 30),
  ('character', 'neko', 'Neko', '/assets/images/characters/neko.svg', 1, 40),
  ('character', 'zuzu', 'Zuzu', '/assets/images/characters/zuzu.svg', 1, 50),
  ('character', 'puddle-pip', 'Puddle Pip', '/assets/images/characters/puddle-pip.svg', 1, 60),
  ('character', 'toasty-dragon', 'Toasty Dragon', '/assets/images/characters/toasty-dragon.svg', 1, 70),
  ('frame', 'none', 'Clean & Cozy', 'frame:none', 1, 10),
  ('frame', 'scallop', 'Mochi Scallop', 'frame:scallop', 1, 20),
  ('frame', 'berry', 'Berry Sweet', 'frame:berry', 0, 30),
  ('frame', 'sparkle', 'Sugar Sparkle', 'frame:sparkle', 0, 40),
  ('frame', 'bamboo', 'Bamboo Hero', 'frame:bamboo', 0, 50),
  ('frame', 'starlight', 'Starlight Halo', 'frame:starlight', 0, 60),
  ('frame', 'flower-crown', 'Flower Crown', 'frame:flower-crown', 0, 70),
  ('frame', 'world-tour', 'World Tour', 'frame:world-tour', 0, 80),
  ('frame', 'champion', 'Arcade Champion', 'frame:champion', 0, 90),
  ('background', 'peach-sky', 'Peach Sky', 'background:peach-sky', 1, 10),
  ('background', 'matcha-meadow', 'Matcha Meadow', 'background:matcha-meadow', 1, 20),
  ('background', 'candy-clouds', 'Candy Clouds', 'background:candy-clouds', 0, 30),
  ('background', 'moonlit', 'Moonlit Cozyverse', 'background:moonlit', 0, 40),
  ('background', 'cosmic', 'Cosmic Mochi', 'background:cosmic', 0, 50),
  ('background', 'golden-arcade', 'Golden Arcade', 'background:golden-arcade', 0, 60);

INSERT OR IGNORE INTO achievement_definitions
  (id, name, description, icon, category, metric, threshold, points, trophy_tier,
   reward_cosmetic_type, reward_cosmetic_key, sort_order, hidden)
VALUES
  ('warm-welcome', 'Warm Welcome', 'Finish your first game.', '🌸', 'play', 'games_played', 1, 10, 'bronze', 'frame', 'berry', 10, 0),
  ('getting-comfy', 'Getting Comfy', 'Play 10 games.', '🧸', 'play', 'games_played', 10, 25, 'bronze', 'background', 'candy-clouds', 20, 0),
  ('arcade-regular', 'Arcade Regular', 'Play 50 games.', '🕹️', 'play', 'games_played', 50, 75, 'silver', 'background', 'moonlit', 30, 0),
  ('arcade-legend', 'Arcade Legend', 'Play 200 games.', '👑', 'play', 'games_played', 200, 200, 'gold', 'frame', 'champion', 40, 0),
  ('pocket-sparkles', 'Pocket Sparkles', 'Earn 1,000 total points.', '✨', 'score', 'total_score', 1000, 15, 'bronze', NULL, NULL, 50, 0),
  ('score-spark', 'Score Spark', 'Earn 10,000 total points.', '⭐', 'score', 'total_score', 10000, 40, 'bronze', 'frame', 'sparkle', 60, 0),
  ('score-superstar', 'Score Superstar', 'Earn 100,000 total points.', '🌟', 'score', 'total_score', 100000, 100, 'silver', 'frame', 'starlight', 70, 0),
  ('million-mochi', 'Million Mochi', 'Earn 1,000,000 total points.', '💫', 'score', 'total_score', 1000000, 300, 'platinum', 'background', 'cosmic', 80, 0),
  ('first-victory', 'First Victory', 'Win your first game.', '🎉', 'victory', 'wins', 1, 15, 'bronze', NULL, NULL, 90, 0),
  ('winning-ways', 'Winning Ways', 'Win 25 games.', '🎋', 'victory', 'wins', 25, 75, 'silver', 'frame', 'bamboo', 100, 0),
  ('cozy-champion', 'Cozy Champion', 'Win 100 games.', '🏆', 'victory', 'wins', 100, 200, 'gold', NULL, NULL, 110, 0),
  ('helpful-boost', 'Helpful Boost', 'Claim your first rewarded boost.', '🎁', 'reward', 'rewards_claimed', 1, 10, 'bronze', NULL, NULL, 120, 0),
  ('power-pal', 'Power Pal', 'Claim 10 rewarded boosts.', '⚡', 'reward', 'rewards_claimed', 10, 35, 'bronze', NULL, NULL, 130, 0),
  ('reward-ranger', 'Reward Ranger', 'Claim 50 rewarded boosts.', '🏅', 'reward', 'rewards_claimed', 50, 100, 'silver', 'background', 'golden-arcade', 140, 0),
  ('fresh-look', 'Fresh Look', 'Create your first custom avatar look.', '🎨', 'style', 'avatar_changes', 1, 10, 'bronze', 'frame', 'flower-crown', 150, 0),
  ('cozy-fashionista', 'Cozy Fashionista', 'Try 10 avatar looks.', '🪡', 'style', 'avatar_changes', 10, 50, 'silver', NULL, NULL, 160, 0),
  ('cozy-explorer', 'Cozy Explorer', 'Play 5 different games.', '🗺️', 'explore', 'distinct_games', 5, 25, 'bronze', NULL, NULL, 170, 0),
  ('world-traveler', 'World Traveler', 'Play 25 different games.', '🌏', 'explore', 'distinct_games', 25, 100, 'silver', 'frame', 'world-tour', 180, 0),
  ('high-flyer', 'High Flyer', 'Score 10,000 points in one game.', '🚀', 'score', 'best_score', 10000, 60, 'silver', NULL, NULL, 190, 0),
  ('star-player', 'Star Player', 'Score 100,000 points in one game.', '🌠', 'score', 'best_score', 100000, 180, 'gold', NULL, NULL, 200, 0);
