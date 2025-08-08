import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL, sslmode="require")
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS ai_usage (
    user_id TEXT PRIMARY KEY,
    token_count INTEGER NOT NULL DEFAULT 0,
    monthly_cost FLOAT NOT NULL DEFAULT 0.0,
    reset_date TIMESTAMP NOT NULL
)
""")

conn.commit()
cur.close()
conn.close()
print("✅ ai_usage table created.")