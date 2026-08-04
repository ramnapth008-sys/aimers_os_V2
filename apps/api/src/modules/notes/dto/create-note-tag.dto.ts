import {
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateNoteTagDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string | null;
}
