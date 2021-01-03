import {
  IsDefined, IsNumber,
  IsOptional, IsString,
} from 'class-validator';

export class CreateBookPublisherDto {
  @IsOptional()
  @IsNumber()
  readonly id: number;

  @IsDefined()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly websiteURL: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  @IsString()
  readonly address: string;

  constructor(partial: Partial<CreateBookPublisherDto>) {
    Object.assign(this, partial);
  }
}
