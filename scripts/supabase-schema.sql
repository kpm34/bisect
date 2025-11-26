-- ============================================================================
-- Bisect Material System - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE material_tab AS ENUM ('finishes', 'tints', 'aged');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Material Categories (Gold, Silver, Copper, Iron, Titanium)
CREATE TABLE IF NOT EXISTS material_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'sparkles',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Presets (15 per category: 5 finishes + 5 tints + 5 aged)
CREATE TABLE IF NOT EXISTS material_presets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES material_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  tab material_tab NOT NULL,
  preview_url VARCHAR(500) NOT NULL,
  color VARCHAR(10) NOT NULL,
  roughness DECIMAL(3,2) NOT NULL CHECK (roughness >= 0 AND roughness <= 1),
  metalness DECIMAL(3,2) NOT NULL CHECK (metalness >= 0 AND metalness <= 1),
  clearcoat DECIMAL(3,2) CHECK (clearcoat >= 0 AND clearcoat <= 1),
  clearcoat_roughness DECIMAL(3,2) CHECK (clearcoat_roughness >= 0 AND clearcoat_roughness <= 1),
  env_map_intensity DECIMAL(3,2) DEFAULT 1.5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Variations (Browse variations for each preset)
CREATE TABLE IF NOT EXISTS material_variations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  preset_id UUID NOT NULL REFERENCES material_presets(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  preview_url VARCHAR(500) NOT NULL,
  roughness DECIMAL(3,2) NOT NULL CHECK (roughness >= 0 AND roughness <= 1),
  metalness DECIMAL(3,2) NOT NULL CHECK (metalness >= 0 AND metalness <= 1),
  color_shift VARCHAR(10),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_presets_category ON material_presets(category_id);
CREATE INDEX idx_presets_tab ON material_presets(tab);
CREATE INDEX idx_presets_category_tab ON material_presets(category_id, tab);
CREATE INDEX idx_variations_preset ON material_variations(preset_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_variations ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view materials)
CREATE POLICY "Public read access for categories" ON material_categories
  FOR SELECT USING (true);

CREATE POLICY "Public read access for presets" ON material_presets
  FOR SELECT USING (true);

CREATE POLICY "Public read access for variations" ON material_variations
  FOR SELECT USING (true);

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for material previews
-- Note: Run this separately or via Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('material-previews', 'material-previews', true);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON material_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_presets_updated_at
  BEFORE UPDATE ON material_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_variations_updated_at
  BEFORE UPDATE ON material_variations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Gold Category
-- ============================================================================

-- Insert Gold category
INSERT INTO material_categories (name, slug, icon, sort_order)
VALUES ('Gold', 'gold', 'sparkles', 1)
ON CONFLICT (slug) DO NOTHING;

-- Get the gold category ID for presets
DO $$
DECLARE
  gold_id UUID;
BEGIN
  SELECT id INTO gold_id FROM material_categories WHERE slug = 'gold';

  -- Finishes (Standard)
  INSERT INTO material_presets (category_id, name, slug, tab, preview_url, color, roughness, metalness, clearcoat, clearcoat_roughness, env_map_intensity, sort_order)
  VALUES
    (gold_id, 'Mirror', 'gold-mirror', 'finishes', '/assets/materials/metal/gold-variations/gold-mirror.png', '#FFD700', 0.00, 1.00, 0.50, 0.10, 1.50, 1),
    (gold_id, 'Polished', 'gold-polished', 'finishes', '/assets/materials/metal/gold-variations/gold-polished.png', '#FFD700', 0.10, 1.00, 0.50, 0.10, 1.50, 2),
    (gold_id, 'Satin', 'gold-satin', 'finishes', '/assets/materials/metal/gold-variations/gold-satin.png', '#FFD700', 0.30, 1.00, NULL, NULL, 1.50, 3),
    (gold_id, 'Brushed', 'gold-brushed', 'finishes', '/assets/materials/metal/gold-variations/gold-brushed.png', '#FFD700', 0.45, 1.00, NULL, NULL, 1.50, 4),
    (gold_id, 'Matte', 'gold-matte', 'finishes', '/assets/materials/metal/gold-variations/gold-matte.png', '#FFD700', 0.60, 1.00, NULL, NULL, 1.50, 5)
  ON CONFLICT (slug) DO NOTHING;

  -- Tints
  INSERT INTO material_presets (category_id, name, slug, tab, preview_url, color, roughness, metalness, clearcoat, clearcoat_roughness, env_map_intensity, sort_order)
  VALUES
    (gold_id, 'Rose Gold', 'gold-rose', 'tints', '/assets/materials/metal/gold-variations/gold-rose.png', '#B76E79', 0.15, 1.00, NULL, NULL, 1.50, 1),
    (gold_id, 'White Gold', 'gold-white', 'tints', '/assets/materials/metal/gold-variations/gold-white.png', '#F5F5F5', 0.10, 1.00, 0.50, 0.10, 1.50, 2),
    (gold_id, 'Champagne', 'gold-champagne', 'tints', '/assets/materials/metal/gold-variations/gold-champagne.png', '#F7E7CE', 0.15, 1.00, NULL, NULL, 1.50, 3),
    (gold_id, 'Rich Gold', 'gold-rich', 'tints', '/assets/materials/metal/gold-variations/gold-rich.png', '#FFC125', 0.15, 1.00, NULL, NULL, 1.50, 4),
    (gold_id, 'Pale Gold', 'gold-pale', 'tints', '/assets/materials/metal/gold-variations/gold-pale.png', '#E6C288', 0.15, 1.00, NULL, NULL, 1.50, 5)
  ON CONFLICT (slug) DO NOTHING;

  -- Aged
  INSERT INTO material_presets (category_id, name, slug, tab, preview_url, color, roughness, metalness, clearcoat, clearcoat_roughness, env_map_intensity, sort_order)
  VALUES
    (gold_id, 'Aged', 'gold-aged', 'aged', '/assets/materials/metal/gold-variations/gold-aged.png', '#CFB53B', 0.40, 0.90, NULL, NULL, 1.50, 1),
    (gold_id, 'Antique', 'gold-antique', 'aged', '/assets/materials/metal/gold-variations/gold-antique.png', '#BB8E34', 0.50, 0.85, NULL, NULL, 1.50, 2),
    (gold_id, 'Dark Gold', 'gold-dark', 'aged', '/assets/materials/metal/gold-variations/gold-dark.png', '#AA6C39', 0.20, 1.00, NULL, NULL, 1.50, 3),
    (gold_id, 'Worn', 'gold-worn', 'aged', '/assets/materials/metal/gold-variations/gold-worn.png', '#D9A626', 0.55, 0.80, NULL, NULL, 1.50, 4),
    (gold_id, 'Rough Cast', 'gold-rough', 'aged', '/assets/materials/metal/gold-variations/gold-rough.png', '#FFD700', 0.80, 1.00, NULL, NULL, 1.50, 5)
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT 'Categories:' as info, COUNT(*) as count FROM material_categories;
SELECT 'Presets:' as info, COUNT(*) as count FROM material_presets;
SELECT 'Variations:' as info, COUNT(*) as count FROM material_variations;
