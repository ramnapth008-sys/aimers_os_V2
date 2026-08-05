import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  BehaviorController,
} from "./behavior.controller";

import {
  BehaviorService,
} from "./behavior.service";

@Module({
  imports: [
    ConsentModule,
  ],

  controllers: [
    BehaviorController,
  ],

  providers: [
    BehaviorService,
  ],

  exports: [
    BehaviorService,
  ],
})
export class BehaviorModule {}
