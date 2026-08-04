import {
  IsString,
  MaxLength,
} from "class-validator";

export class CreateResearchThreadDto {
  @IsString()
  @MaxLength(240)
  title!: string;
}
