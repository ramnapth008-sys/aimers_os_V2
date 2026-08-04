import {
  ResearchProjectStatus,
} from "@aimers/database";

import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class ListResearchProjectsQueryDto {
  @IsOptional()
  @IsEnum(ResearchProjectStatus)
  status?: ResearchProjectStatus;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  search?: string;
}
