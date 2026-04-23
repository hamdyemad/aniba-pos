export interface ApiDepartment {
  id: number;
  slug: string;
  name: string;
  image: string;
  icon: string;
  categories_count: number;
  products_count: number;
}

export interface ApiCurrency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  use_image: boolean;
  image: string | null;
  display: string;
  active: boolean;
}

export interface ApiCountry {
  id: number;
  name: string;
  code: string;
  slug: string;
  default: number;
  phone_code: string;
  phone_length: number;
  image: string;
  currency: ApiCurrency;
  active: number;
}

export interface CountryApiResponse {
  status: boolean;
  message: string;
  data: ApiCountry[];
}

export interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  image: string;
  icon: string;
  department: {
    id: number;
    slug: string;
    name: string;
  };
  products_count: number;
}

export interface ApiSubcategory {
  id: number;
  name: string;
  slug: string;
  parent: {
    id: number;
    slug: string;
    name: string;
  };
  image: string;
  icon: string;
  products_count: number;
}

export interface ApiProduct {
  id: number;
  sku: string;
  variant_name: string;
  variant_tree: string;
  vendor_product: {
    id: number;
    slug: string;
    name: string;
    image: string;
    additional_images: string[];
    sku: string;
  };
  points: number;
  real_price_before_taxes: string;
  real_price: string;
  fake_price_before_taxes: string | null;
  fake_price: string | null;
  taxes: {
    id: number;
    name: string;
    percentage: number;
    tax_rate: number;
    is_active: boolean;
  }[];
  discount: number | null;
  variant_images: string[];
  total_stock: number;
  remaining_stock: number;
  created_at: string;
  updated_at: string;
  vendor: {
    id: number;
    name: string;
    slug: string;
  };
  brand: {
    id: number;
    title: string | null;
    slug: string;
  };
  department: {
    id: number;
    name: string;
    slug: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  sub_category: null | any;
}

export interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ProductsApiResponse {
  status: boolean;
  message: string;
  errors: any[];
  data: ApiProduct[];
  pagination: ApiPagination;
}

export interface DepartmentsApiResponse {
  status: boolean;
  message: string;
  data: ApiDepartment[];
  pagination?: ApiPagination;
}

export interface CategoriesApiResponse {
  status: boolean;
  message: string;
  data: ApiCategory[];
  pagination?: ApiPagination;
}

export interface SubcategoriesApiResponse {
  status: boolean;
  message: string;
  data: ApiSubcategory[];
  pagination?: ApiPagination;
}

export interface ApiVariant {
  id: number;
  sku: string;
  stock: number;
  remaining_stock: number;
  price_before_taxes: string;
  real_price: string;
  fake_price: string;
  discount: number;
  images: string[];
}

export interface ApiConfigNode {
  id: number;
  name: string;
  value: string | null;
  type: string | null;
  color: string | null;
  key_id?: number;
  children?: ApiConfigNode[];
  variant?: ApiVariant;
}

export interface ApiDetailedProduct {
  id: number;
  slug: string;
  vendors: {
    vendor: {
      id: number;
      name: string;
      logo: string;
    };
    vendor_product: {
      id: number;
      name: string;
      image: string;
      points: number;
      sku: string;
      stock: number;
      configuration_type: string;
      configuration_tree: ApiConfigNode[];
      brand: { title: string };
      department: { name: string };
      category: { name: string };
      sub_category: { name: string } | null;
    };
  }[];
}

export interface DetailedProductApiResponse {
  status: boolean;
  message: string;
  data: ApiDetailedProduct;
}
