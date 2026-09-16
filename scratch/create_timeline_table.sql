CREATE TABLE IF NOT EXISTS timeline_posts (
    id bigserial PRIMARY KEY,
    name text NOT NULL DEFAULT '名無しの広場民',
    avatar text NOT NULL DEFAULT '🐰',
    content text NOT NULL,
    likes integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_posts_created_at_idx ON timeline_posts(created_at DESC);

ALTER TABLE timeline_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read" ON timeline_posts FOR SELECT USING (true);

CREATE POLICY "anyone_can_insert" ON timeline_posts FOR INSERT WITH CHECK (
    length(content) >= 1 AND length(content) <= 100
);

CREATE POLICY "anyone_can_update_likes" ON timeline_posts FOR UPDATE USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE timeline_posts;

INSERT INTO timeline_posts (name, avatar, content) VALUES
('らび🐰', '🐰', '広場のタイムライン、はじまったらび〜！みんなのひとことをここで共有してね！🥕✨');
