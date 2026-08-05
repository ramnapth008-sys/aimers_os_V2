import {
  Type,
} from "class-transformer";

import {
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";

import {
  CreateActivityEventDto,
} from "./create-activity-event.dto";

export class IngestActivityEventsDto {
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      CreateActivityEventDto,
  )
  events!:
    CreateActivityEventDto[];
}
