import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { UserRole } from "@aimers/database";

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
  CompleteFlashcardReviewSessionDto,
} from "./dto/complete-flashcard-review-session.dto";

import {
  CreateFlashcardReviewSessionDto,
} from "./dto/create-flashcard-review-session.dto";

import {
  ReviewFlashcardDto,
} from "./dto/review-flashcard.dto";

import {
  FlashcardsService,
} from "./flashcards.service";

@Roles(UserRole.STUDENT)
@Controller("flashcards")
export class FlashcardsController {
  constructor(
    @Inject(FlashcardsService)
    private readonly flashcardsService: FlashcardsService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.flashcardsService.getWorkspace(user.userId);
  }

  @Get("decks")
  listDecks(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.flashcardsService.listDecks(user.userId);
  }

  @Get("decks/:deckId")
  getDeck(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("deckId")
    deckId: string,
  ) {
    return this.flashcardsService.getDeck(
      user.userId,
      deckId,
    );
  }

  @Post("review-sessions")
  startOrResumeReviewSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateFlashcardReviewSessionDto,
  ) {
    return this.flashcardsService.startOrResumeReviewSession(
      user.userId,
      dto,
    );
  }

  @Get("review-sessions/:sessionId")
  getReviewSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,
  ) {
    return this.flashcardsService.getReviewSession(
      user.userId,
      sessionId,
    );
  }

  @Patch(
    "review-sessions/:sessionId/items/:itemId/review",
  )
  reviewCard(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,

    @Param("itemId")
    itemId: string,

    @Body()
    dto: ReviewFlashcardDto,
  ) {
    return this.flashcardsService.reviewCard(
      user.userId,
      sessionId,
      itemId,
      dto,
    );
  }

  @Patch(
    "review-sessions/:sessionId/complete",
  )
  completeReviewSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,

    @Body()
    dto: CompleteFlashcardReviewSessionDto,
  ) {
    return this.flashcardsService.completeReviewSession(
      user.userId,
      sessionId,
      dto,
    );
  }
}
