import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class GenerateMentorBriefDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
