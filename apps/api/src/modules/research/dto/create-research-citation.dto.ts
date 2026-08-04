import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateResearchCitationDto {
  @IsUUID()
  researchSourceId!: string;

  @IsOptional()
  @IsUUID()
  researchSourceExcerptId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @IsOptional()
  @IsString()
  quote?: string | null;
}
