import {
  Type,
} from "class-transformer";

import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import {
  RecordSectionResultDto,
} from "./record-section-result.dto";

export class RecordMockTestAttemptDto {
  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds!: number;

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentile?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rank?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rankOutOf?: number;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique(
    (
      item:
        RecordSectionResultDto,
    ) =>
      item.sectionId,
  )
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      RecordSectionResultDto,
  )
  sections!: RecordSectionResultDto[];
}
