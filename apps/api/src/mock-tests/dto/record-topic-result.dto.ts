import {
  IsInt,
  IsUUID,
  Min,
} from "class-validator";

export class RecordTopicResultDto {
  @IsUUID()
  topicId!: string;

  @IsInt()
  @Min(0)
  attemptedQuestions!: number;

  @IsInt()
  @Min(0)
  correctAnswers!: number;

  @IsInt()
  @Min(0)
  incorrectAnswers!: number;
}
