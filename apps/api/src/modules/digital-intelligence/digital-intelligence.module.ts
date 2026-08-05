import {
  Module,
} from "@nestjs/common";

import {
  ActivityModule,
} from "../activity/activity.module";

import {
  BehaviorModule,
} from "../behavior/behavior.module";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  DevicesModule,
} from "../devices/devices.module";

import {
  InterventionsModule,
} from "../interventions/interventions.module";

import {
  PrivacyModule,
} from "../privacy/privacy.module";

@Module({
  imports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
    ActivityModule,
    BehaviorModule,
    InterventionsModule,
  ],

  exports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
    ActivityModule,
    BehaviorModule,
    InterventionsModule,
  ],
})
export class DigitalIntelligenceModule {}
