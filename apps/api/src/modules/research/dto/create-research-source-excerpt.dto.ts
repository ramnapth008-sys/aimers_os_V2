import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateResearchSourceExcerptDto {
  @IsString()
  quote!: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  locator?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageNumber?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  startOffset?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  endOffset?: number | null;
}
