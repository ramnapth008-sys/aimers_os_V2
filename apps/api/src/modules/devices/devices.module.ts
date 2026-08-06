import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  ConnectorSetupController,
} from "./connector-setup.controller";

import {
  ConnectorSetupService,
} from "./connector-setup.service";

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
    ConnectorSetupController,
    DevicesController,
  ],

  providers: [
    ConnectorSetupService,
    DevicesService,
  ],

  exports: [
    ConnectorSetupService,
    DevicesService,
  ],
})
export class DevicesModule {}
