import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  DevicesModule,
} from "../devices/devices.module";

import {
  PrivacyModule,
} from "../privacy/privacy.module";

@Module({
  imports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
  ],

  exports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
  ],
})
export class DigitalIntelligenceModule {}
