// Supabase Database Types for Material System
// Auto-generated from Supabase schema + custom extensions

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Extended physical material properties (MeshPhysicalMaterial)
// Defined first as it's referenced by other types
export interface PhysicalProps {
  // Clearcoat (car paint, lacquered surfaces)
  clearcoatRoughness?: number;    // 0-1

  // Environment
  envMapIntensity?: number;       // Default 1.5 for metals

  // Sheen (fabric, velvet)
  sheen?: number;                 // 0-1
  sheenRoughness?: number;        // 0-1 (0.3=silk, 0.8=velvet)
  sheenColor?: string;            // Hex color

  // Transmission (glass)
  transmission?: number;          // 0-1
  thickness?: number;
  ior?: number;                   // Index of refraction (1.5 for glass)
  attenuationColor?: string;      // Hex color
  attenuationDistance?: number;

  // Iridescence (soap bubbles, oil slicks, anodized metal)
  iridescence?: number;           // 0-1
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];

  // Anisotropy (brushed metal)
  anisotropy?: number;            // 0-1
  anisotropyRotation?: number;    // Radians
}

export interface Database {
  public: {
    Tables: {
      material_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon: string | null;
          display_mode: 'tabs' | 'flat';  // tabs = finishes/tints/aged, flat = single grid
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          icon?: string | null;
          display_mode?: 'tabs' | 'flat';
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          icon?: string | null;
          display_mode?: 'tabs' | 'flat';
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      material_presets: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          tab: string | null;  // null for flat display_mode categories
          preview_url: string | null;
          color: string;
          roughness: number;
          metalness: number;
          clearcoat: number | null;
          physical_props: Json | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          tab?: string | null;
          preview_url?: string | null;
          color?: string;
          roughness?: number;
          metalness?: number;
          clearcoat?: number | null;
          physical_props?: Json | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          slug?: string;
          name?: string;
          tab?: string | null;
          preview_url?: string | null;
          color?: string;
          roughness?: number;
          metalness?: number;
          clearcoat?: number | null;
          physical_props?: Json | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'material_presets_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'material_categories';
            referencedColumns: ['id'];
          }
        ];
      };
      material_variations: {
        Row: {
          id: string;
          preset_id: string;
          slug: string;
          name: string;
          preview_url: string | null;
          roughness: number;
          metalness: number;
          color_shift: string | null;
          physical_props: Json | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          preset_id: string;
          slug: string;
          name: string;
          preview_url?: string | null;
          roughness: number;
          metalness: number;
          color_shift?: string | null;
          physical_props?: Json | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          preset_id?: string;
          slug?: string;
          name?: string;
          preview_url?: string | null;
          roughness?: number;
          metalness?: number;
          color_shift?: string | null;
          physical_props?: Json | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'material_variations_preset_id_fkey';
            columns: ['preset_id'];
            isOneToOne: false;
            referencedRelation: 'material_presets';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      material_tab: 'finishes' | 'tints' | 'aged';
    };
  };
}

// Row type aliases - use these throughout the app
export type MaterialCategory = Database['public']['Tables']['material_categories']['Row'];

// MaterialPreset with typed tab and physical_props
export type MaterialPreset = Omit<
  Database['public']['Tables']['material_presets']['Row'],
  'tab' | 'physical_props'
> & {
  tab: 'finishes' | 'tints' | 'aged' | null;  // null for flat display_mode categories (e.g., wood)
  physical_props: PhysicalProps | null;
};

// MaterialVariation with typed physical_props
export type MaterialVariation = Omit<
  Database['public']['Tables']['material_variations']['Row'],
  'physical_props'
> & {
  physical_props: PhysicalProps | null;
};

// Material application data (what gets sent to Three.js)
export interface MaterialProperties {
  color: number;           // Three.js color (hex number)
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
  // Extended physical props
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: number;
  iridescence?: number;
  iridescenceIOR?: number;
  anisotropy?: number;
  anisotropyRotation?: number;
}

// Preset with category info (for joined queries)
export interface MaterialPresetWithCategory extends MaterialPreset {
  category: MaterialCategory;
}
