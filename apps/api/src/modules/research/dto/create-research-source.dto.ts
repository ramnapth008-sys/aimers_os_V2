import {
  ResearchSourceStatus,
  ResearchSourceType,
} from "@aimers/database";

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateResearchSourceDto {
  @IsEnum(ResearchSourceType)
  type!: ResearchSourceType;

  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsEnum(ResearchSourceStatus)
  status?: ResearchSourceStatus;

  @IsOptional()
  @IsUUID()
  sourceNoteId?: string | null;

  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  author?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  publisher?: string | null;

  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;

  @IsOptional()
  @IsDateString()
  accessedAt?: string | null;

  @IsOptional()
  @IsString()
  rawContent?: string | null;

  @IsOptional()
  @IsString()
  summary?: string | null;

  @IsOptional()
  @IsString()
  citationText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  citationKey?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  reliabilityScore?: number | null;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
