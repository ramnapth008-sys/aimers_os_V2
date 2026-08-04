import {
  ResearchMindMapNodeType,
} from "@aimers/database";

import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateResearchMindMapNodeDto {
  @IsString()
  @MaxLength(240)
  title!: string;

  @IsOptional()
  @IsEnum(ResearchMindMapNodeType)
  type?: ResearchMindMapNodeType;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsUUID()
  researchSourceId?: string | null;

  @IsOptional()
  @IsUUID()
  noteId?: string | null;

  @IsOptional()
  @IsNumber()
  positionX?: number;

  @IsOptional()
  @IsNumber()
  positionY?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequenceNumber?: number;
}
