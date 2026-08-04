import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  UserRole,
} from "@aimers/database";

import type {
  AuthenticatedUser,
} from "../auth/auth.types";

import {
  CurrentUser,
} from "../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../auth/decorators/roles.decorator";

import {
  AnswerPracticeItemDto,
} from "./dto/answer-practice-item.dto";

import {
  CompletePracticeSessionDto,
} from "./dto/complete-practice-session.dto";

import {
  CreatePracticeSessionDto,
} from "./dto/create-practice-session.dto";

import {
  ListQuestionsQueryDto,
} from "./dto/list-questions-query.dto";

import {
  QuestionBankService,
} from "./question-bank.service";

@Roles(UserRole.STUDENT)
@Controller("question-bank")
export class QuestionBankController {
  constructor(
    @Inject(QuestionBankService)
    private readonly questionBankService:
      QuestionBankService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.questionBankService
      .getWorkspace(
        user.userId,
      );
  }

  @Get("questions")
  listQuestions(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      ListQuestionsQueryDto,
  ) {
    return this.questionBankService
      .listQuestions(
        user.userId,
        query,
      );
  }

  @Get("questions/:questionId")
  getQuestion(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("questionId")
    questionId: string,
  ) {
    return this.questionBankService
      .getQuestion(
        user.userId,
        questionId,
      );
  }

  @Post("bookmarks/:questionId")
  bookmarkQuestion(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("questionId")
    questionId: string,
  ) {
    return this.questionBankService
      .bookmarkQuestion(
        user.userId,
        questionId,
      );
  }

  @Delete("bookmarks/:questionId")
  removeBookmark(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("questionId")
    questionId: string,
  ) {
    return this.questionBankService
      .removeBookmark(
        user.userId,
        questionId,
      );
  }

  @Post("practice-sessions")
  createPracticeSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      CreatePracticeSessionDto,
  ) {
    return this.questionBankService
      .createPracticeSession(
        user.userId,
        dto,
      );
  }

  @Get(
    "practice-sessions/:sessionId",
  )
  getPracticeSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,
  ) {
    return this.questionBankService
      .getPracticeSession(
        user.userId,
        sessionId,
      );
  }

  @Patch(
    "practice-sessions/:sessionId/items/:itemId/answer",
  )
  answerPracticeItem(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,

    @Param("itemId")
    itemId: string,

    @Body()
    dto:
      AnswerPracticeItemDto,
  ) {
    return this.questionBankService
      .answerPracticeItem(
        user.userId,
        sessionId,
        itemId,
        dto,
      );
  }

  @Patch(
    "practice-sessions/:sessionId/complete",
  )
  completePracticeSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,

    @Body()
    dto:
      CompletePracticeSessionDto,
  ) {
    return this.questionBankService
      .completePracticeSession(
        user.userId,
        sessionId,
        dto,
      );
  }
}
