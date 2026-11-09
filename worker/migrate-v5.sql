ALTER TABLE notifications ADD COLUMN response TEXT;
UPDATE orders SET status='batal', catatan=TRIM(COALESCE(catatan,'')||' [uji coba lama — ditutup sebelum Fonnte aktif]'), updated_at=strftime('%s','now') WHERE status IN ('baru','menunggu_wa','dibayar');
