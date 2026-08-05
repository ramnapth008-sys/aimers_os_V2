import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  DevicesController,
} from "./devices.controller";

import {
  DevicesService,
} from "./devices.service";

@Module({
  imports: [
    ConsentModule,
  ],

  controllers: [
    DevicesController,
  ],

  providers: [
    DevicesService,
  ],

  exports: [
    DevicesService,
  ],
})
export class DevicesModule {}
