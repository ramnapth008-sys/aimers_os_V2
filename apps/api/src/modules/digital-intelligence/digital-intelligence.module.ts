import {
  Module,
} from "@nestjs/common";

import {
  ActivityModule,
} from "../activity/activity.module";

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
    ActivityModule,
  ],

  exports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
    ActivityModule,
  ],
})
export class DigitalIntelligenceModule {}
