-- Buat sequence untuk nomor pendaftaran
CREATE SEQUENCE IF NOT EXISTS pendaftar_nomor_seq START 1;

-- Buat function untuk men-generate nomor pendaftaran secara otomatis
CREATE OR REPLACE FUNCTION set_nomor_pendaftaran()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nomor_pendaftaran IS NULL OR NEW.nomor_pendaftaran = '' THEN
        NEW.nomor_pendaftaran := 'SPMB-2026-' || LPAD(nextval('pendaftar_nomor_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada tabel pendaftar sebelum operasi INSERT
DROP TRIGGER IF EXISTS trigger_set_nomor_pendaftaran ON pendaftar;
CREATE TRIGGER trigger_set_nomor_pendaftaran
BEFORE INSERT ON pendaftar
FOR EACH ROW
EXECUTE FUNCTION set_nomor_pendaftaran();
