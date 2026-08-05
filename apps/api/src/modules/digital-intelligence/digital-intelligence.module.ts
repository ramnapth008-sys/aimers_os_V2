import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  PrivacyModule,
} from "../privacy/privacy.module";

@Module({
  imports: [
    ConsentModule,
    PrivacyModule,
  ],

  exports: [
    ConsentModule,
    PrivacyModule,
  ],
})
export class DigitalIntelligenceModule {}
