import {
  ResearchProjectStatus,
} from "@aimers/database";

import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class UpdateResearchProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  researchQuestion?: string | null;

  @IsOptional()
  @IsEnum(ResearchProjectStatus)
  status?: ResearchProjectStatus;

  @IsOptional()
  @IsUUID()
  subjectId?: string | null;

  @IsOptional()
  @IsUUID()
  chapterId?: string | null;

  @IsOptional()
  @IsUUID()
  topicId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
