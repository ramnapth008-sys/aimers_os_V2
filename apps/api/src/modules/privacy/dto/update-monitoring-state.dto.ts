import {
  IsBoolean,
} from "class-validator";

export class UpdateMonitoringStateDto {
  @IsBoolean()
  paused!: boolean;
}
