CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(16) NULL,
  image VARCHAR(512) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS user_config (
  user_id CHAR(36) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL DEFAULT 'anthropic',
  model VARCHAR(128) NULL,
  temperature DECIMAL(4,2) NOT NULL DEFAULT 0.70,
  max_tokens INT NULL,
  verbosity VARCHAR(16) NOT NULL DEFAULT 'standard',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  idea TEXT NOT NULL,
  output MEDIUMTEXT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  model VARCHAR(128) NULL,
  missing_sections JSON NOT NULL,
  quality_score INT NOT NULL,
  versions JSON NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_history_user_created (user_id, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_templates (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  idea TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_templates_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usage_records (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(16) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  model VARCHAR(128) NOT NULL,
  prompt_tokens INT NULL,
  completion_tokens INT NULL,
  total_tokens INT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_usage_user_created (user_id, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspaces (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspace_invitations (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  inviter_id CHAR(36) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_ws_invite_email (workspace_id, email),
  INDEX idx_invitations_email_status (email, status),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspace_config (
  workspace_id CHAR(36) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL DEFAULT 'anthropic',
  model VARCHAR(128) NULL,
  temperature DECIMAL(4,2) NOT NULL DEFAULT 0.70,
  max_tokens INT NULL,
  verbosity VARCHAR(16) NOT NULL DEFAULT 'standard',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shares (
  id VARCHAR(16) PRIMARY KEY,
  user_id CHAR(36) NULL,
  idea TEXT NOT NULL,
  output MEDIUMTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NULL,
  INDEX idx_shares_created (created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
