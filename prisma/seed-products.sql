-- Seed Products Script
-- Run this with: psql -f prisma/seed-products.sql

-- AYAM & TELUR
INSERT INTO "Product" (id, sku, name, price, "costPrice", stock, unit, category, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'AYM-001', 'Ayam Kampung Besar', 105000, 90000, 50, 'ekor', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-002', 'Ayam Kampung Sedang', 85000, 72000, 50, 'ekor', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-003', 'Ayam Kampung Kecil', 60000, 50000, 50, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-004', 'Ayam TG (Toko)', 58000, 48000, 100, 'ekor', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-005', 'Ati Ampela', 3500, 2500, 200, 'pcs', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-006', 'Ceker Ayam', 28000, 22000, 50, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-007', 'Fillet Paha Ayam', 60000, 50000, 50, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-008', 'Fillet Dada Ayam', 63000, 52000, 50, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-009', 'Kepala Ayam', 21000, 16000, 30, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-010', 'Kulit Ayam', 35000, 28000, 30, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-011', 'Paha Atas Ayam', 45000, 38000, 80, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-012', 'Paha Bawah Ayam', 45000, 38000, 80, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-013', 'Ayam Campur', 42000, 35000, 60, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-014', 'Ayam Pejantan', 49000, 40000, 30, 'ekor', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-015', 'Sayap Ayam', 45000, 38000, 50, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-016', 'Usus Ayam', 30000, 24000, 30, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-017', 'Tulang Ayam', 22000, 16000, 40, 'kg', 'ayam', true, NOW(), NOW()),
  (gen_random_uuid(), 'AYM-018', 'Tulang Bokong Ayam', 28000, 22000, 40, 'kg', 'ayam', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "costPrice" = EXCLUDED."costPrice",
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- DAGING SAPI
INSERT INTO "Product" (id, sku, name, price, "costPrice", stock, unit, category, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'SAP-001', 'Ati Sapi', 90000, 75000, 30, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-002', 'Babat Sapi', 85000, 70000, 30, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-003', 'Daging Cincang Sapi', 160000, 140000, 40, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-004', 'Tulang Iga Sapi', 42000, 35000, 50, '500g', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-005', 'Paha Sapi Low Fat', 145000, 125000, 30, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-006', 'Lamusir Sapi', 140000, 120000, 30, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-007', 'Limpa Sapi', 100000, 85000, 20, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-008', 'Paru Sapi', 70000, 58000, 25, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-009', 'Sandung Lamur', 140000, 120000, 25, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-010', 'Tetelan Sapi', 65000, 55000, 40, '500g', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-011', 'Jando Sapi', 40000, 32000, 30, '500g', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-012', 'Daging Iga Sapi', 135000, 115000, 25, 'kg', 'daging-sapi', true, NOW(), NOW()),
  (gen_random_uuid(), 'SAP-013', 'Otak Sapi', 70000, 58000, 15, 'kg', 'daging-sapi', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "costPrice" = EXCLUDED."costPrice",
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- IKAN LAUT
INSERT INTO "Product" (id, sku, name, price, "costPrice", stock, unit, category, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'IKN-001', 'Balakutak', 68000, 55000, 40, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-002', 'Bandeng', 55000, 45000, 50, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-003', 'Bawal Laut Hitam', 68000, 55000, 30, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-004', 'Bawal Laut Putih', 180000, 155000, 20, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-005', 'Bawal Tawar', 50000, 40000, 35, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-009', 'Fillet Kakap', 60000, 48000, 40, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-010', 'Fillet Tuna', 42000, 34000, 40, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-011', 'Fillet Gabus', 60000, 48000, 30, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-012', 'Ikan Gabus', 58000, 48000, 30, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-013', 'Ikan Gurame', 70000, 58000, 35, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-014', 'Ikan Kerapu', 55000, 45000, 25, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-015', 'Ikan Tongkol', 60000, 48000, 50, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-016', 'Kembung Banjar', 65000, 52000, 40, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-017', 'Kembung Biasa', 65000, 52000, 45, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-018', 'Kepala Kakap', 65000, 52000, 25, 'kg', 'ikan-laut', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "costPrice" = EXCLUDED."costPrice",
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- SEAFOOD
INSERT INTO "Product" (id, sku, name, price, "costPrice", stock, unit, category, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'SEA-001', 'Kepiting Biasa', 110000, 90000, 20, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'SEA-002', 'Kepiting Telor', 115000, 95000, 15, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'SEA-003', 'Kerang Dara', 35000, 28000, 40, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'SEA-004', 'Kerang Hijau', 25000, 18000, 50, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'SEA-005', 'Kerang Tahu', 30000, 22000, 40, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'SEA-006', 'Kerang Hijau Kupas', 50000, 40000, 30, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-006', 'Cumi Besar', 115000, 95000, 30, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-007', 'Cumi Sedang', 110000, 90000, 40, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKN-008', 'Cumi Kecil', 90000, 75000, 50, 'kg', 'seafood', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "costPrice" = EXCLUDED."costPrice",
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- IKAN TAWAR
INSERT INTO "Product" (id, sku, name, price, "costPrice", stock, unit, category, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'IKT-001', 'Ikan Patin', 38000, 30000, 50, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-002', 'Ikan Mas', 38000, 30000, 50, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-003', 'Ikan Lele', 35000, 28000, 60, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-004', 'Ikan Nila', 43000, 35000, 50, 'kg', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-005', 'Telur Ikan Nila', 32000, 25000, 25, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-006', 'Tenggiri Fillet/Kerok/Giling', 70000, 58000, 30, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-007', 'Fillet Lele', 50000, 40000, 35, '400g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-008', 'Fillet Patin', 40000, 32000, 35, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-009', 'Fillet Kakap Merah', 57000, 46000, 30, '500g', 'ikan-laut', true, NOW(), NOW()),
  (gen_random_uuid(), 'IKT-010', 'Telur Ikan Patin', 33000, 26000, 20, '500g', 'ikan-laut', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "costPrice" = EXCLUDED."costPrice",
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- UDANG
INSERT INTO "Product" (id, sku, name, price, "costPrice", stock, unit, category, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'UDG-001', 'Udang Peci Besar', 120000, 100000, 25, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'UDG-002', 'Udang Peci Sedang', 110000, 90000, 30, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'UDG-003', 'Udang Peci Kecil', 85000, 70000, 40, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'UDG-004', 'Udang Vaname Sedang', 110000, 90000, 35, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'UDG-005', 'Udang Vaname Besar', 115000, 95000, 30, 'kg', 'seafood', true, NOW(), NOW()),
  (gen_random_uuid(), 'UDG-006', 'Udang Windu Tiger Besar', 130000, 110000, 20, 'kg', 'seafood', true, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "costPrice" = EXCLUDED."costPrice",
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

SELECT COUNT(*) as total_products FROM "Product";
