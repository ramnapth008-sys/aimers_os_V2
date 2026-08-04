import {
  Type,
} from "class-transformer";

import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

import {
  RecordTopicResultDto,
} from "./record-topic-result.dto";

export class RecordSectionResultDto {
  @IsUUID()
  sectionId!: string;

  @IsInt()
  @Min(0)
  attemptedQuestions!: number;

  @IsInt()
  @Min(0)
  correctAnswers!: number;

  @IsInt()
  @Min(0)
  incorrectAnswers!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique(
    (
      item:
        RecordTopicResultDto,
    ) =>
      item.topicId,
  )
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      RecordTopicResultDto,
  )
  topicResults?: RecordTopicResultDto[];
}
