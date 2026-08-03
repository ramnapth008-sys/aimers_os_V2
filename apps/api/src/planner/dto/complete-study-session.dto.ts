import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export class CompleteStudySessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  focusMinutes?: number;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  notes?: string;
}
