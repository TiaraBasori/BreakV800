-- BreakV800 leaderboard schema
-- v1: initial table

CREATE TABLE IF NOT EXISTS entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname     TEXT    NOT NULL,
  v0           REAL    NOT NULL,          -- 刹车初速度 km/h (客户端上报, 服务端校验)
  stop_time    REAL    NOT NULL,          -- 刹停用时 s   (客户端上报, 服务端校验)
  score        INTEGER NOT NULL,          -- 服务端计算: round(v0*v0/stop_time)
  created_ip   TEXT,                      -- 提交来源 IP 前缀 (限速用, 不展示)
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_score ON entries (score DESC);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries (created_at);
