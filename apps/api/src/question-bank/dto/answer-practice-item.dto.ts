import {
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class AnswerPracticeItemDto {
  @IsUUID()
  selectedOptionId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  timeSpentSeconds?: number;
}
