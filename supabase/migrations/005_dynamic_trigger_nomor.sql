-- ==============================================================================
-- Migration: 005_dynamic_trigger_nomor.sql
-- Description: Update trigger generation nomor pendaftaran to be dynamic
-- ==============================================================================

-- 1. Create or Replace the Function
CREATE OR REPLACE FUNCTION set_nomor_pendaftaran()
RETURNS TRIGGER AS $$
DECLARE
    v_tahun TEXT;
BEGIN
    -- Jika nomor pendaftaran kosong dari client, kita generate
    IF NEW.nomor_pendaftaran IS NULL OR NEW.nomor_pendaftaran = '' THEN
        
        -- Ambil 4 karakter pertama dari tahun_periode (contoh: '2026/2027' -> '2026')
        SELECT LEFT(tahun_periode, 4) INTO v_tahun 
        FROM pengaturan_sistem 
        WHERE id = 1;
        
        -- Fallback jika tabel belum di-seed atau null
        IF v_tahun IS NULL OR v_tahun = '' THEN
            v_tahun := '2026';
        END IF;

        -- Generate nomor urut dengan sequence dan pad dengan '0'
        NEW.nomor_pendaftaran := 'SPMB-' || v_tahun || '-' || LPAD(nextval('pendaftar_nomor_seq')::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the old trigger if it exists to recreate it cleanly
DROP TRIGGER IF EXISTS trigger_set_nomor_pendaftaran ON pendaftar;

-- 3. Recreate the Trigger
CREATE TRIGGER trigger_set_nomor_pendaftaran
    BEFORE INSERT ON pendaftar
    FOR EACH ROW
    EXECUTE FUNCTION set_nomor_pendaftaran();
