import {
  IsDateString,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name!: string;

  @IsInt()
  @Min(60)
  @Max(7200)
  initialSeconds!: number;

  @IsInt()
  @Min(0)
  @Max(60)
  incrementSeconds!: number;

  @IsDateString()
  startsAt!: string;
}