CREATE DATABASE IF NOT EXISTS inkflow;
USE inkflow;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS essays (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('Drafting', 'In Review', 'Ready') NOT NULL DEFAULT 'Drafting',
  word_count INT UNSIGNED NOT NULL DEFAULT 0,
  ai_suggestions INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_essays_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_essays_user_updated (user_id, updated_at)
);

CREATE TABLE IF NOT EXISTS concepts (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  category ENUM(
    'Biology',
    'Chemistry',
    'Physics',
    'Computer Science',
    'Mathematics',
    'General Science'
  ) NOT NULL,
  definition TEXT NOT NULL,
  tags JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_concepts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_concepts_user_updated (user_id, updated_at)
);

CREATE TABLE IF NOT EXISTS technology_topics (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_technology_topics (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_id CHAR(36) NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_technology_topics_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_technology_topics_topic
    FOREIGN KEY (topic_id) REFERENCES technology_topics(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_user_topic (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS technology_insights (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  source_url VARCHAR(500) NULL,
  tags JSON NOT NULL,
  status ENUM('Collected', 'Analyzed', 'Drafted') NOT NULL DEFAULT 'Collected',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_technology_insights_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_technology_insights_topic
    FOREIGN KEY (topic_id) REFERENCES technology_topics(id)
    ON DELETE RESTRICT,
  INDEX idx_technology_insights_user_topic_updated (user_id, topic_id, updated_at)
);

CREATE TABLE IF NOT EXISTS technology_briefs (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_id CHAR(36) NOT NULL,
  summary TEXT NOT NULL,
  key_points JSON NOT NULL,
  opportunities JSON NOT NULL,
  risks JSON NOT NULL,
  source_insight_ids JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_technology_briefs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_technology_briefs_topic
    FOREIGN KEY (topic_id) REFERENCES technology_topics(id)
    ON DELETE RESTRICT,
  INDEX idx_technology_briefs_user_topic_created (user_id, topic_id, created_at)
);

CREATE TABLE IF NOT EXISTS technology_outlines (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  topic_id CHAR(36) NOT NULL,
  brief_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  thesis TEXT NOT NULL,
  sections JSON NOT NULL,
  tone VARCHAR(40) NOT NULL DEFAULT 'analytical',
  target_length INT UNSIGNED NOT NULL DEFAULT 1200,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_technology_outlines_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_technology_outlines_topic
    FOREIGN KEY (topic_id) REFERENCES technology_topics(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_technology_outlines_brief
    FOREIGN KEY (brief_id) REFERENCES technology_briefs(id)
    ON DELETE CASCADE,
  INDEX idx_technology_outlines_user_topic_created (user_id, topic_id, created_at)
);

INSERT INTO technology_topics (id, name, slug, description, is_active)
SELECT * FROM (
  SELECT '8f6f2bb5-11c0-49f8-b1a7-7ed2ec3891e0' AS id, 'Artificial Intelligence' AS name, 'artificial-intelligence' AS slug,
         'Model innovation, deployment patterns, governance, and real-world AI adoption.', 1
  UNION ALL
  SELECT '3fc205f1-3078-429c-b0be-fb39f370f305', 'Cybersecurity', 'cybersecurity',
         'Threat landscape, secure architectures, and practical defense strategies.', 1
  UNION ALL
  SELECT 'c65b8a79-c6f5-46b5-a8b7-f34e4609f06a', 'Cloud Computing', 'cloud-computing',
         'Cloud-native design, cost optimization, and platform engineering trends.', 1
  UNION ALL
  SELECT '72674182-272e-48f7-b706-f4ee0ed4881e', 'Developer Tools', 'developer-tools',
         'Toolchains, DX workflows, and the impact of automation on software teams.', 1
  UNION ALL
  SELECT '6bb4cd86-f28a-4bb0-9f32-5d1362fef3a2', 'Data Engineering', 'data-engineering',
         'Pipelines, quality, governance, and scalable analytics infrastructure.', 1
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM technology_topics existing WHERE existing.id = seed.id
);
