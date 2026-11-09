ALTER TABLE orders ADD COLUMN channel TEXT NOT NULL DEFAULT 'web';
ALTER TABLE orders ADD COLUMN reminded_at INTEGER;
ALTER TABLE orders ADD COLUMN reminder_count INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT, kind TEXT NOT NULL, provider TEXT NOT NULL, target TEXT, message TEXT, status TEXT NOT NULL, error TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_notif_order ON notifications(order_id);
