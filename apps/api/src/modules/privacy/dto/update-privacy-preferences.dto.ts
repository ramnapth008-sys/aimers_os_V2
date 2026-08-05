import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class UpdatePrivacyPreferencesDto {
  @IsOptional()
  @IsBoolean()
  monitoringEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  backgroundMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  crossDeviceSync?: boolean;

  @IsOptional()
  @IsBoolean()
  storeRawActivity?: boolean;

  @IsOptional()
  @IsBoolean()
  storeFullUrls?: boolean;

  @IsOptional()
  @IsBoolean()
  importPastHistory?: boolean;

  @IsOptional()
  @IsBoolean()
  allowAiContext?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBehaviorAnalysis?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  allowFocusControls?: boolean;

  @IsOptional()
  @IsBoolean()
  localProcessingPreferred?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  rawRetentionDays?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(3650)
  summaryRetentionDays?: number;
}
