-- Faz 3: beğeni, şikâyet, moderasyon gizlemesi, roller. Idempotent.
CREATE TABLE IF NOT EXISTS reactions (
  comment_id BIGINT NOT NULL REFERENCES comments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  UNIQUE (comment_id, reporter_id)
);

-- Moderasyonla gizlenen yorumlar (soft delete'ten ayrı: kayıt ve rapor izi kalır)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'moderator', 'admin'));

CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions (comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_open ON reports (status) WHERE status = 'open';
