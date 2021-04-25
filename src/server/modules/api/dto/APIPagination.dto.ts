import {Transform} from 'class-transformer';
import {IsDivisibleBy, IsNumber, IsOptional, Max} from 'class-validator';

export class APIPaginationDto {
  @IsOptional()
  @Transform(({value}) => Number.parseInt(value, 10))
  @IsNumber()
  offset: number = 0;

  @IsOptional()
  @Transform(({value}) => Number.parseInt(value, 10))
  @IsNumber()
  @IsDivisibleBy(5)
  @Max(50)
  limit: number = 10;
}
