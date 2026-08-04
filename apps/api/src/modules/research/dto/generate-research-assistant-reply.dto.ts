import {
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class GenerateResearchAssistantReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  content!: string;
}
