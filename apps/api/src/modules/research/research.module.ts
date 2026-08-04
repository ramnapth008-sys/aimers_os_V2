import {
  Module,
} from "@nestjs/common";

import {
  AiModule,
} from "../../ai/ai.module";

import {
  ResearchController,
} from "./research.controller";

import {
  ResearchService,
} from "./research.service";

@Module({
  imports: [
    AiModule,
  ],

  controllers: [
    ResearchController,
  ],
  providers: [
    ResearchService,
  ],
  exports: [
    ResearchService,
  ],
})
export class ResearchModule {}
