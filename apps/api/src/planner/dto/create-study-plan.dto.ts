import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class CreateStudyPlanDto {
  @IsString()
  @Length(2, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
