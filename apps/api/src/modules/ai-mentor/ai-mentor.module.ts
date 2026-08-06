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
  ],

  exports: [
    AiMentorService,
  ],
})
export class AiMentorModule {}
