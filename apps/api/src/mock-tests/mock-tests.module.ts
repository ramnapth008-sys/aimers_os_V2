import {
  Module,
} from "@nestjs/common";

import {
  MockTestRunnerController,
} from "./mock-test-runner.controller";

import {
  MockTestsController,
} from "./mock-tests.controller";

import {
  MockTestRunnerService,
} from "./mock-test-runner.service";

import {
  MockTestsService,
} from "./mock-tests.service";

@Module({
  controllers: [
    MockTestsController,
    MockTestRunnerController,
  ],

  providers: [
    MockTestsService,
    MockTestRunnerService,
  ],

  exports: [
    MockTestsService,
    MockTestRunnerService,
  ],
})
export class MockTestsModule {}
