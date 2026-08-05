import {
  Module,
} from "@nestjs/common";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  PrivacyController,
} from "./privacy.controller";

import {
  PrivacyService,
} from "./privacy.service";

@Module({
  imports: [
    ConsentModule,
  ],

  controllers: [
    PrivacyController,
  ],

  providers: [
    PrivacyService,
  ],

  exports: [
    PrivacyService,
  ],
})
export class PrivacyModule {}
