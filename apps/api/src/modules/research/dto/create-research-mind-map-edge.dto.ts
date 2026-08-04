import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateResearchMindMapEdgeDto {
  @IsUUID()
  sourceNodeId!: string;

  @IsUUID()
  targetNodeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string | null;
}
