import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  ActivityController,
} from "./activity.controller";

import {
  ActivityService,
} from "./activity.service";

@Module({
  imports: [
    ConsentModule,
  ],

  controllers: [
    ActivityController,
  ],

  providers: [
    ActivityService,
  ],

  exports: [
    ActivityService,
  ],
})
export class ActivityModule {}
