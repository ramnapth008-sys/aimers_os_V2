import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class GenerateResearchAssistantReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  content!: string;

  @IsOptional()
  @IsUUID()
  researchSourceId?: string | null;

  @IsOptional()
  @IsUUID()
  researchSourceExcerptId?: string | null;
}
