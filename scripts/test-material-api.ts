#!/usr/bin/env npx tsx
/**
 * Test script for Bisect Material API
 * Creates a test material preset to verify Supabase integration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMaterialAPI() {
  console.log('\n=== Testing Bisect Material API ===\n');

  // 1. List existing categories
  console.log('1. Fetching existing categories...');
  const { data: categories, error: catError } = await supabase
    .from('material_categories')
    .select('*')
    .order('sort_order');

  if (catError) {
    console.error('   Failed to fetch categories:', catError.message);
    return;
  }

  console.log(`   Found ${categories.length} categories:`);
  categories.forEach(c => console.log(`   - ${c.name} (${c.slug})`));

  // 2. Get first category for test
  const testCategory = categories[0];
  if (!testCategory) {
    console.error('   No categories found, cannot create test preset');
    return;
  }

  // 3. Create a test preset
  console.log(`\n2. Creating test preset in "${testCategory.name}" category...`);

  const testSlug = `test-material-${Date.now()}`;
  const { data: newPreset, error: createError } = await supabase
    .from('material_presets')
    .insert({
      category_id: testCategory.id,
      slug: testSlug,
      name: 'Test Material',
      tab: 'finishes',
      color: '#FF5733',
      roughness: 0.3,
      metalness: 0.9,
      clearcoat: 0.5,
      sort_order: 999,
      physical_props: {
        envMapIntensity: 1.2,
        clearcoatRoughness: 0.1
      }
    })
    .select()
    .single();

  if (createError) {
    console.error('   Failed to create preset:', createError.message);
    return;
  }

  console.log('   Created preset successfully!');
  console.log('   ID:', newPreset.id);
  console.log('   Slug:', newPreset.slug);
  console.log('   Color:', newPreset.color);
  console.log('   Roughness:', newPreset.roughness);
  console.log('   Metalness:', newPreset.metalness);

  // 4. Verify by fetching it back
  console.log('\n3. Verifying preset was saved...');
  const { data: fetchedPreset, error: fetchError } = await supabase
    .from('material_presets')
    .select('*')
    .eq('slug', testSlug)
    .single();

  if (fetchError) {
    console.error('   Failed to fetch preset:', fetchError.message);
  } else {
    console.log('   Preset fetched successfully!');
    console.log('   Name:', fetchedPreset.name);
  }

  // 5. Clean up - delete test preset
  console.log('\n4. Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('material_presets')
    .delete()
    .eq('slug', testSlug);

  if (deleteError) {
    console.error('   Failed to delete test preset:', deleteError.message);
  } else {
    console.log('   Test preset deleted successfully!');
  }

  console.log('\n=== API Test Complete ===\n');
}

testMaterialAPI().catch(console.error);
