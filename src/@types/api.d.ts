// Common API types and interfaces

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    cached?: boolean;
  };
  errors?: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
}

export interface QueryOptions extends PaginationQuery {
  filters?: Record<string, any>;
  populate?: string | string[];
  select?: string;
  lean?: boolean;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface AuthContext {
  userId: string;
  role: string;
  permissions: string[];
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CloudinaryResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
}
