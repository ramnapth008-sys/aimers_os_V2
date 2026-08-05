import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class GrantConsentDto {
  @IsString()
  @MaxLength(40)
  policyVersion!: string;

  @IsOptional()
  @IsISO8601({
    strict: true,
  })
  expiresAt?: string;
}
