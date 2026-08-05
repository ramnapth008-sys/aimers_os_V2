import {
  DataConnectorStatus,
} from "@aimers/database";

import {
  IsEnum,
} from "class-validator";

export class UpdateConnectorStatusDto {
  @IsEnum(
    DataConnectorStatus,
  )
  status!: DataConnectorStatus;
}
