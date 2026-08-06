import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export class RespondMentorCheckInDto {
  @IsString()
  @Length(1, 2000)
  answer!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  selectedOption?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  energyScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  focusScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  moodScore?: number;
}
