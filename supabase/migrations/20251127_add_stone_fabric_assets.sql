-- Add Stone Subcategories
INSERT INTO material_categories (slug, name, sort_order, display_mode) VALUES
('marble', 'Marble', 10, 'flat'),
('granite', 'Granite', 11, 'flat'),
('concrete', 'Concrete', 12, 'flat'),
('sandstone', 'Sandstone', 13, 'flat'),
('slate', 'Slate', 14, 'flat')
ON CONFLICT (slug) DO NOTHING;

-- Add Fabric Subcategories
INSERT INTO material_categories (slug, name, sort_order, display_mode) VALUES
('cotton', 'Cotton', 20, 'flat'),
('silk', 'Silk', 21, 'flat'),
('denim', 'Denim', 22, 'flat'),
('leather', 'Leather', 23, 'flat'),
('velvet', 'Velvet', 24, 'flat')
ON CONFLICT (slug) DO NOTHING;

-- Add Presets for Marble
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'marble-carrara', 'Carrara White', '#F5F5F5', 0.1, 0.0, '/assets/generated/stone-marble-carrara.png', 1 FROM material_categories WHERE slug = 'marble';

INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'marble-black', 'Black Marquina', '#1a1a1a', 0.1, 0.0, '/assets/generated/stone-marble-black.png', 2 FROM material_categories WHERE slug = 'marble';

-- Add Presets for Granite
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'granite-speckled', 'Speckled Grey', '#9E9E9E', 0.4, 0.0, '/assets/generated/stone-granite-speckled.png', 1 FROM material_categories WHERE slug = 'granite';

-- Add Presets for Concrete
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'concrete-smooth', 'Smooth Grey', '#808080', 0.8, 0.0, '/assets/generated/stone-concrete-smooth.png', 1 FROM material_categories WHERE slug = 'concrete';

-- Add Presets for Sandstone
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'sandstone-beige', 'Desert Beige', '#D2B48C', 0.9, 0.0, '/assets/generated/stone-sandstone-beige.png', 1 FROM material_categories WHERE slug = 'sandstone';

-- Add Presets for Slate
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'slate-dark', 'Dark Slate', '#4A4A4A', 0.6, 0.0, '/assets/generated/stone-slate-dark.png', 1 FROM material_categories WHERE slug = 'slate';

-- Add Presets for Cotton
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'cotton-white', 'Basic White', '#FFFFFF', 0.9, 0.0, '/assets/generated/fabric-cotton-white.png', 1 FROM material_categories WHERE slug = 'cotton';

-- Add Presets for Silk
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'silk-red', 'Crimson Red', '#8B0000', 0.4, 0.0, '/assets/generated/fabric-silk-red.png', 1 FROM material_categories WHERE slug = 'silk';

-- Add Presets for Denim
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'denim-blue', 'Classic Blue', '#1E3A8A', 0.8, 0.0, '/assets/generated/fabric-denim-blue.png', 1 FROM material_categories WHERE slug = 'denim';

-- Add Presets for Leather
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'leather-brown', 'Saddle Brown', '#8B4513', 0.6, 0.0, '/assets/generated/fabric-leather-brown.png', 1 FROM material_categories WHERE slug = 'leather';

-- Add Presets for Velvet
INSERT INTO material_presets (category_id, slug, name, color, roughness, metalness, preview_url, sort_order) 
SELECT id, 'velvet-purple', 'Royal Purple', '#800080', 0.7, 0.0, '/assets/generated/fabric-velvet-purple.png', 1 FROM material_categories WHERE slug = 'velvet';
