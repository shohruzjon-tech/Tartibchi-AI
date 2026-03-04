import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PaginationDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc";
}

export class TenantPaginationDto extends PaginationDto {
  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class BranchPaginationDto extends TenantPaginationDto {
  @IsString()
  @IsOptional()
  branchId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
