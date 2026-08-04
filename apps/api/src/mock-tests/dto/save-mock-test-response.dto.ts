import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class SaveMockTestResponseDto {
  @IsOptional()
  @IsUUID()
  selectedOptionId?:
    string | null;

  @IsOptional()
  @IsBoolean()
  isMarkedForReview?:
    boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  timeSpentSeconds?:
    number;
}
