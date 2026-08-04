import {
  Module,
} from "@nestjs/common";

import {
  MemoryEngineController,
} from "./memory-engine.controller";

import {
  MemoryEngineService,
} from "./memory-engine.service";

@Module({
  controllers: [
    MemoryEngineController,
  ],

  providers: [
    MemoryEngineService,
  ],

  exports: [
    MemoryEngineService,
  ],
})
export class MemoryEngineModule {}
