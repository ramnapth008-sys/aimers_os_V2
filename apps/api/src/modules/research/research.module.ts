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
  ResearchSourceIngestionService,
} from "./research-source-ingestion.service";

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
    ResearchSourceIngestionService,
  ],
  exports: [
    ResearchService,
  ],
})
export class ResearchModule {}
