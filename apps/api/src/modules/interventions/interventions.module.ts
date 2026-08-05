import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  InterventionsController,
} from "./interventions.controller";

import {
  InterventionsService,
} from "./interventions.service";

@Module({
  imports: [
    ConsentModule,
  ],

  controllers: [
    InterventionsController,
  ],

  providers: [
    InterventionsService,
  ],

  exports: [
    InterventionsService,
  ],
})
export class InterventionsModule {}
