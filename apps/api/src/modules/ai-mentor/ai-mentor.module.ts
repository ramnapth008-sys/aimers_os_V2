import {
  Module,
} from "@nestjs/common";

import {
  DatabaseModule,
} from "../../infrastructure/database/database.module";

import {
  ConsentModule,
} from "../consent/consent.module";

import {
  AiMentorController,
} from "./ai-mentor.controller";

import {
  AiMentorService,
} from "./ai-mentor.service";

import {
  DetailedActivityContextService,
} from "./detailed-activity-context.service";

@Module({
  imports: [
    DatabaseModule,
    ConsentModule,
  ],

  controllers: [
    AiMentorController,
  ],

  providers: [
    AiMentorService,
    DetailedActivityContextService,
  ],

  exports: [
    AiMentorService,
  ],
})
export class AiMentorModule {}
