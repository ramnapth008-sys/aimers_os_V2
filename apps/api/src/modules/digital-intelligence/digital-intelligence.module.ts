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

import {
  IntelligenceController,
} from "./intelligence.controller";

import {
  IntelligenceService,
} from "./intelligence.service";

@Module({
  imports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
    ActivityModule,
    BehaviorModule,
    InterventionsModule,
  ],

  controllers: [
    IntelligenceController,
  ],

  providers: [
    IntelligenceService,
  ],

  exports: [
    ConsentModule,
    PrivacyModule,
    DevicesModule,
    ActivityModule,
    BehaviorModule,
    InterventionsModule,
    IntelligenceService,
  ],
})
export class DigitalIntelligenceModule {}
