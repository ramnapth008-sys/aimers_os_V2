import {
  NoteStatus,
} from "@aimers/database";

import {
  IsEnum,
} from "class-validator";

export class UpdateNoteStatusDto {
  @IsEnum(NoteStatus)
  status!: NoteStatus;
}
