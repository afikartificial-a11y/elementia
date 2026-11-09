CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, company TEXT NOT NULL, role TEXT, phone TEXT NOT NULL, email TEXT, city TEXT, commodities TEXT, volume TEXT, note TEXT, source TEXT NOT NULL DEFAULT 'bisnis', ip TEXT, status TEXT NOT NULL DEFAULT 'baru', created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
