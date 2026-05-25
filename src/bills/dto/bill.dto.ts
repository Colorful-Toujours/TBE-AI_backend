import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class BillMaterialDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class ListBillsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  community?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  includeMaterials?: string;
}

export class CreateBillDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  date: string;

  @IsString()
  user: string;

  @IsString()
  community: string;

  @IsString()
  unit: string;

  @Type(() => Number)
  @IsNumber()
  receivable: number;

  @Type(() => Number)
  @IsNumber()
  received: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillMaterialDto)
  materials: BillMaterialDto[];
}

export class UpdateBillDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  community?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  receivable?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  received?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillMaterialDto)
  materials?: BillMaterialDto[];
}
