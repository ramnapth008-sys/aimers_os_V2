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
} from "../../auth/auth.types";

import {
  CurrentUser,
} from "../../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../../auth/decorators/roles.decorator";

import {
  CreateResearchCitationDto,
} from "./dto/create-research-citation.dto";

import {
  CreateResearchMessageDto,
} from "./dto/create-research-message.dto";

import {
  GenerateResearchAssistantReplyDto,
} from "./dto/generate-research-assistant-reply.dto";

import {
  CreateResearchMindMapEdgeDto,
} from "./dto/create-research-mind-map-edge.dto";

import {
  CreateResearchMindMapNodeDto,
} from "./dto/create-research-mind-map-node.dto";

import {
  CreateResearchProjectDto,
} from "./dto/create-research-project.dto";

import {
  CreateResearchSourceExcerptDto,
} from "./dto/create-research-source-excerpt.dto";

import {
  CreateResearchSourceDto,
} from "./dto/create-research-source.dto";

import {
  CreateResearchThreadDto,
} from "./dto/create-research-thread.dto";

import {
  ListResearchProjectsQueryDto,
} from "./dto/list-research-projects-query.dto";

import {
  UpdateResearchMindMapNodeDto,
} from "./dto/update-research-mind-map-node.dto";

import {
  UpdateResearchProjectDto,
} from "./dto/update-research-project.dto";

import {
  UpdateResearchSourceDto,
} from "./dto/update-research-source.dto";

import {
  ResearchService,
} from "./research.service";

@Roles(UserRole.STUDENT)
@Controller("research")
export class ResearchController {
  constructor(
    @Inject(ResearchService)
    private readonly researchService:
      ResearchService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
    @Query()
    query: ListResearchProjectsQueryDto,
  ) {
    return this.researchService
      .getWorkspace(
        user.userId,
        query,
      );
  }

  @Post("projects")
  createProject(
    @CurrentUser()
    user: AuthenticatedUser,
    @Body()
    dto: CreateResearchProjectDto,
  ) {
    return this.researchService
      .createProject(
        user.userId,
        dto,
      );
  }

  @Get("projects/:projectId")
  getProject(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
  ) {
    return this.researchService
      .getProject(
        user.userId,
        projectId,
      );
  }

  @Patch("projects/:projectId")
  updateProject(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Body()
    dto: UpdateResearchProjectDto,
  ) {
    return this.researchService
      .updateProject(
        user.userId,
        projectId,
        dto,
      );
  }

  @Delete("projects/:projectId")
  deleteProject(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
  ) {
    return this.researchService
      .deleteProject(
        user.userId,
        projectId,
      );
  }

  @Post("projects/:projectId/sources")
  createSource(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Body()
    dto: CreateResearchSourceDto,
  ) {
    return this.researchService
      .createSource(
        user.userId,
        projectId,
        dto,
      );
  }

  @Patch(
    "projects/:projectId/sources/:sourceId",
  )
  updateSource(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("sourceId")
    sourceId: string,
    @Body()
    dto: UpdateResearchSourceDto,
  ) {
    return this.researchService
      .updateSource(
        user.userId,
        projectId,
        sourceId,
        dto,
      );
  }

  @Post(
    "projects/:projectId/sources/:sourceId/ingest",
  )
  ingestSource(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("sourceId")
    sourceId: string,
  ) {
    return this.researchService
      .ingestSource(
        user.userId,
        projectId,
        sourceId,
      );
  }

  @Delete(
    "projects/:projectId/sources/:sourceId",
  )
  deleteSource(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("sourceId")
    sourceId: string,
  ) {
    return this.researchService
      .deleteSource(
        user.userId,
        projectId,
        sourceId,
      );
  }

  @Post(
    "projects/:projectId/sources/:sourceId/excerpts",
  )
  createExcerpt(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("sourceId")
    sourceId: string,
    @Body()
    dto: CreateResearchSourceExcerptDto,
  ) {
    return this.researchService
      .createExcerpt(
        user.userId,
        projectId,
        sourceId,
        dto,
      );
  }

  @Delete(
    "projects/:projectId/sources/:sourceId/excerpts/:excerptId",
  )
  deleteExcerpt(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("sourceId")
    sourceId: string,
    @Param("excerptId")
    excerptId: string,
  ) {
    return this.researchService
      .deleteExcerpt(
        user.userId,
        projectId,
        sourceId,
        excerptId,
      );
  }

  @Post("projects/:projectId/threads")
  createThread(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Body()
    dto: CreateResearchThreadDto,
  ) {
    return this.researchService
      .createThread(
        user.userId,
        projectId,
        dto,
      );
  }

  @Post(
    "projects/:projectId/threads/:threadId/messages",
  )
  createMessage(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("threadId")
    threadId: string,
    @Body()
    dto: CreateResearchMessageDto,
  ) {
    return this.researchService
      .createMessage(
        user.userId,
        projectId,
        threadId,
        dto,
      );
  }

  @Post(
    "projects/:projectId/threads/:threadId/assistant",
  )
  generateAssistantReply(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("threadId")
    threadId: string,
    @Body()
    dto: GenerateResearchAssistantReplyDto,
  ) {
    return this.researchService
      .generateAssistantReply(
        user.userId,
        projectId,
        threadId,
        dto,
      );
  }

  @Post(
    "projects/:projectId/threads/:threadId/messages/:messageId/citations",
  )
  createCitation(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("threadId")
    threadId: string,
    @Param("messageId")
    messageId: string,
    @Body()
    dto: CreateResearchCitationDto,
  ) {
    return this.researchService
      .createCitation(
        user.userId,
        projectId,
        threadId,
        messageId,
        dto,
      );
  }

  @Post("projects/:projectId/nodes")
  createMindMapNode(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Body()
    dto: CreateResearchMindMapNodeDto,
  ) {
    return this.researchService
      .createMindMapNode(
        user.userId,
        projectId,
        dto,
      );
  }

  @Patch(
    "projects/:projectId/nodes/:nodeId",
  )
  updateMindMapNode(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("nodeId")
    nodeId: string,
    @Body()
    dto: UpdateResearchMindMapNodeDto,
  ) {
    return this.researchService
      .updateMindMapNode(
        user.userId,
        projectId,
        nodeId,
        dto,
      );
  }

  @Delete(
    "projects/:projectId/nodes/:nodeId",
  )
  deleteMindMapNode(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("nodeId")
    nodeId: string,
  ) {
    return this.researchService
      .deleteMindMapNode(
        user.userId,
        projectId,
        nodeId,
      );
  }

  @Post("projects/:projectId/edges")
  createMindMapEdge(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Body()
    dto: CreateResearchMindMapEdgeDto,
  ) {
    return this.researchService
      .createMindMapEdge(
        user.userId,
        projectId,
        dto,
      );
  }

  @Patch(
    "projects/:projectId/edges/:edgeId",
  )
  updateMindMapEdge(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("edgeId")
    edgeId: string,
    @Body()
    dto: CreateResearchMindMapEdgeDto,
  ) {
    return this.researchService
      .updateMindMapEdge(
        user.userId,
        projectId,
        edgeId,
        dto,
      );
  }

  @Delete(
    "projects/:projectId/edges/:edgeId",
  )
  deleteMindMapEdge(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("projectId")
    projectId: string,
    @Param("edgeId")
    edgeId: string,
  ) {
    return this.researchService
      .deleteMindMapEdge(
        user.userId,
        projectId,
        edgeId,
      );
  }
}
