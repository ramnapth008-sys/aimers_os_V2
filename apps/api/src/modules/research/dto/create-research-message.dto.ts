import {
  ResearchMessageRole,
} from "@aimers/database";

import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateResearchMessageDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(ResearchMessageRole)
  role?: ResearchMessageRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string | null;
}
