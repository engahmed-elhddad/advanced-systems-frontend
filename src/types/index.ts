export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  website?: string;
  country?: string;
  product_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  parent_id?: number;
  product_count?: number;
  children?: Category[];
}

export interface ProductSpec {
  key: string;
  value: string;
  unit?: string;
  sort_order?: number;
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductDatasheet {
  id: number;
  name: string;
  url: string;
  file_size?: number;
}

export interface Product {
  id: number;
  part_number: string;
  name: string;
  slug: string;
  series?: string;
  description?: string;
  short_description?: string;
  price_usd?: number;
  availability: "available" | "limited" | "unavailable";
  stock_quantity?: number;
  brand?: Brand;
  category?: Category;
  images: ProductImage[];
  datasheets: ProductDatasheet[];
  specs: ProductSpec[];
  is_featured: boolean;
  view_count?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface RFQFormData {
  part_number: string;
  quantity: number;
  company: string;
  contact_name: string;
  email: string;
  phone?: string;
  country: string;
  message?: string;
  product_id?: number;
}

export interface Supplier {
  id: number;
  name: string;
  slug: string;
  country?: string;
  contact_email?: string;
  website?: string;
  logo_url?: string;
}

export interface SearchResult {
  id: number;
  part_number: string;
  name: string;
  slug: string;
  brand_name?: string;
  brand_slug?: string;
  category_name?: string;
  primary_image?: string;
  price_usd?: number;
  availability: string;
}
