import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateNoteFolderDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @IsOptional()
  @IsUUID()
  parentFolderId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  sequenceNumber?: number;

  @IsOptional()
  @IsBoolean()
  isExpanded?: boolean;
}
