import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateNoteLinkDto {
  @IsUUID()
  targetNoteId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;
}
