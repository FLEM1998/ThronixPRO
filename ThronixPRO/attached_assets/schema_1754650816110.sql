CREATE TABLE ai_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coin TEXT NOT NULL,
  strategy JSONB,
  pnl FLOAT,
  result TEXT,
  timestamp TIMESTAMP DEFAULT now()
);