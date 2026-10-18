import {
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListTournamentsDto {
  @IsOptional()
  @IsIn(['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED'])
  status?: 'DRAFT' | 'OPEN' | 'ONGOING' | 'COMPLETED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}