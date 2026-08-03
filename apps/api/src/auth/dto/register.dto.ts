import { Transform } from "class-transformer";

import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim().toLowerCase()
      : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
