import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(7200)
  initialSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  incrementSeconds?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED'])
  status?: 'DRAFT' | 'OPEN' | 'ONGOING' | 'COMPLETED';
}