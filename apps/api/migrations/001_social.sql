-- Sosyal şema (Faz 2): kullanıcılar + yorumlar. Idempotent.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,                       -- OIDC sub (Keycloak/dev-issuer)
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('word', 'ayah', 'page', 'surah')),
  target_key TEXT NOT NULL,                  -- word: '2:255:3' | ayah: '2:255' | page: '42' | surah: '2'
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  parent_id BIGINT REFERENCES comments(id),  -- yanıt (tek seviye)
  quote_id BIGINT REFERENCES comments(id),   -- alıntı
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON comments (target_type, target_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id) WHERE deleted_at IS NULL;
