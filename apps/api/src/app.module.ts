import {
  Module,
} from "@nestjs/common";

import {
  ConfigModule,
} from "@nestjs/config";

import {
  AppController,
} from "./app.controller";

import {
  AcademicModule,
} from "./academic/academic.module";

import {
  AuthModule,
} from "./auth/auth.module";

import {
  validateEnvironment,
} from "./config/environment";

import {
  HealthController,
} from "./health/health.controller";

import {
  DatabaseModule,
} from "./infrastructure/database/database.module";

import {
  RedisModule,
} from "./infrastructure/redis/redis.module";

import {
  OnboardingModule,
} from "./onboarding/onboarding.module";

import {
  MockTestsModule,
} from "./mock-tests/mock-tests.module";

import {
  PlannerModule,
} from "./planner/planner.module";

import {
  FlashcardsModule,
} from "./flashcards/flashcards.module";

import {
  MemoryEngineModule,
} from "./memory-engine/memory-engine.module";

import {
  NotesModule,
} from "./modules/notes/notes.module";

import {
  ResearchModule,
} from "./modules/research/research.module";

import {
  AiMentorModule,
} from "./modules/ai-mentor/ai-mentor.module";

import {
  DigitalIntelligenceModule,
} from "./modules/digital-intelligence/digital-intelligence.module";

import {
  QuestionBankModule,
} from "./question-bank/question-bank.module";

import {
  ProfileModule,
} from "./profile/profile.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate:
        validateEnvironment,
    }),

    DatabaseModule,
    RedisModule,
    AuthModule,
    AcademicModule,
    PlannerModule,
    MockTestsModule,
    FlashcardsModule,
    MemoryEngineModule,
    NotesModule,
    ResearchModule,
    AiMentorModule,
    DigitalIntelligenceModule,
    QuestionBankModule,
    ProfileModule,
    OnboardingModule,
  ],

  controllers: [
    AppController,
    HealthController,
  ],
})
export class AppModule {}
