import {
  Transform,
} from "class-transformer";

import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName?: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @Matches(
    /^[0-9+()\-\s]{7,30}$/,
    {
      message:
        "phoneNumber must be a valid phone number.",
    },
  )
  phoneNumber?: string;
}
