import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from "@nestjs/common";

import {
  UserRole,
} from "@aimers/database";

import type {
  AuthenticatedUser,
} from "../../auth/auth.types";

import {
  CurrentUser,
} from "../../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../../auth/decorators/roles.decorator";

import {
  AiMentorService,
} from "./ai-mentor.service";

import {
  GenerateMentorBriefDto,
} from "./dto/generate-mentor-brief.dto";

import {
  RespondMentorCheckInDto,
} from "./dto/respond-mentor-check-in.dto";

import {
  SendMentorMessageDto,
} from "./dto/send-mentor-message.dto";

@Roles(UserRole.STUDENT)
@Controller("ai-mentor")
export class AiMentorController {
  constructor(
    @Inject(AiMentorService)
    private readonly service:
      AiMentorService,
  ) {}

  // AIMERS_PROACTIVE_AI_MENTOR_FOUNDATION_V1
  @Get("workspace")
  workspace(
    @CurrentUser()
    user:
      AuthenticatedUser,

    @Query("timezone")
    timezone?:
      string,
  ) {
    return this.service
      .workspace(
        user.userId,
        timezone,
      );
  }

  @Post("messages")
  sendMessage(
    @CurrentUser()
    user:
      AuthenticatedUser,

    @Body()
    dto:
      SendMentorMessageDto,
  ) {
    return this.service
      .sendMessage(
        user.userId,
        dto,
      );
  }

  @Post("brief")
  generateBrief(
    @CurrentUser()
    user:
      AuthenticatedUser,

    @Body()
    dto:
      GenerateMentorBriefDto,
  ) {
    return this.service
      .generateBrief(
        user.userId,
        dto,
      );
  }

  @Post("check-ins/:checkInId/respond")
  respondToCheckIn(
    @CurrentUser()
    user:
      AuthenticatedUser,

    @Param("checkInId")
    checkInId:
      string,

    @Body()
    dto:
      RespondMentorCheckInDto,
  ) {
    return this.service
      .respondToCheckIn(
        user.userId,
        checkInId,
        dto,
      );
  }
}
