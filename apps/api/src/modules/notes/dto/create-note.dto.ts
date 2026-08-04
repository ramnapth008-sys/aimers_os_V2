import {
  NoteContentFormat,
  NoteSourceType,
} from "@aimers/database";

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(NoteContentFormat)
  contentFormat?: NoteContentFormat;

  @IsOptional()
  @IsEnum(NoteSourceType)
  sourceType?: NoteSourceType;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsUUID()
  subjectId?: string | null;

  @IsOptional()
  @IsUUID()
  chapterId?: string | null;

  @IsOptional()
  @IsUUID()
  topicId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("4", {
    each: true,
  })
  tagIds?: string[];
}
