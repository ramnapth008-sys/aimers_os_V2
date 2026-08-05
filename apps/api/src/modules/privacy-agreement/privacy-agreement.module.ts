import {
  Module,
} from "@nestjs/common";

import {
  DatabaseModule,
} from "../../infrastructure/database/database.module";

import {
  PrivacyAgreementController,
} from "./privacy-agreement.controller";

import {
  PrivacyAgreementService,
} from "./privacy-agreement.service";

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    PrivacyAgreementController,
  ],

  providers: [
    PrivacyAgreementService,
  ],

  exports: [
    PrivacyAgreementService,
  ],
})
export class PrivacyAgreementModule {}
