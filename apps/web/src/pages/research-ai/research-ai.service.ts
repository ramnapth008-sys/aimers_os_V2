import type {
  ApiFetch,
  CreateResearchCitationInput,
  CreateResearchMessageInput,
  CreateResearchMindMapEdgeInput,
  CreateResearchMindMapNodeInput,
  CreateResearchProjectInput,
  CreateResearchSourceExcerptInput,
  CreateResearchSourceInput,
  CreateResearchThreadInput,
  GenerateResearchAssistantReplyInput,
  ResearchAssistantReplyResult,
  ResearchCitationRecord,
  ResearchMessageRecord,
  ResearchMindMapEdgeRecord,
  ResearchMindMapNodeRecord,
  ResearchProjectWorkspace,
  ResearchSourceExcerpt,
  ResearchSourceRecord,
  ResearchThreadRecord,
  ResearchWorkspace,
  ResearchWorkspaceFilters,
  UpdateResearchMindMapNodeInput,
  UpdateResearchProjectInput,
  UpdateResearchSourceInput,
} from "./research-ai.types";

function workspaceQuery(
  filters: ResearchWorkspaceFilters = {},
): string {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }

  if (filters.chapterId) {
    params.set("chapterId", filters.chapterId);
  }

  if (filters.topicId) {
    params.set("topicId", filters.topicId);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function getResearchWorkspace(
  apiFetch: ApiFetch,
  filters: ResearchWorkspaceFilters = {},
): Promise<ResearchWorkspace> {
  return apiFetch<ResearchWorkspace>(
    `/research/me${workspaceQuery(filters)}`,
  );
}

export function createResearchProject(
  apiFetch: ApiFetch,
  input: CreateResearchProjectInput,
): Promise<ResearchProjectWorkspace> {
  return apiFetch<ResearchProjectWorkspace>(
    "/research/projects",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getResearchProject(
  apiFetch: ApiFetch,
  projectId: string,
): Promise<ResearchProjectWorkspace> {
  return apiFetch<ResearchProjectWorkspace>(
    `/research/projects/${projectId}`,
  );
}

export function updateResearchProject(
  apiFetch: ApiFetch,
  projectId: string,
  input: UpdateResearchProjectInput,
): Promise<ResearchProjectWorkspace> {
  return apiFetch<ResearchProjectWorkspace>(
    `/research/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteResearchProject(
  apiFetch: ApiFetch,
  projectId: string,
): Promise<{ success: true; projectId: string }> {
  return apiFetch<{ success: true; projectId: string }>(
    `/research/projects/${projectId}`,
    {
      method: "DELETE",
    },
  );
}

export function createResearchSource(
  apiFetch: ApiFetch,
  projectId: string,
  input: CreateResearchSourceInput,
): Promise<ResearchSourceRecord> {
  return apiFetch<ResearchSourceRecord>(
    `/research/projects/${projectId}/sources`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function ingestResearchSource(
  apiFetch: ApiFetch,
  projectId: string,
  sourceId: string,
): Promise<ResearchSourceRecord> {
  return apiFetch<ResearchSourceRecord>(
    `/research/projects/${projectId}/sources/${sourceId}/ingest`,
    {
      method: "POST",
    },
  );
}

export function updateResearchSource(
  apiFetch: ApiFetch,
  projectId: string,
  sourceId: string,
  input: UpdateResearchSourceInput,
): Promise<ResearchSourceRecord> {
  return apiFetch<ResearchSourceRecord>(
    `/research/projects/${projectId}/sources/${sourceId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteResearchSource(
  apiFetch: ApiFetch,
  projectId: string,
  sourceId: string,
): Promise<{ success: true; sourceId: string }> {
  return apiFetch<{ success: true; sourceId: string }>(
    `/research/projects/${projectId}/sources/${sourceId}`,
    {
      method: "DELETE",
    },
  );
}

export function createResearchExcerpt(
  apiFetch: ApiFetch,
  projectId: string,
  sourceId: string,
  input: CreateResearchSourceExcerptInput,
): Promise<ResearchSourceExcerpt> {
  return apiFetch<ResearchSourceExcerpt>(
    `/research/projects/${projectId}/sources/${sourceId}/excerpts`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function deleteResearchExcerpt(
  apiFetch: ApiFetch,
  projectId: string,
  sourceId: string,
  excerptId: string,
): Promise<{ success: true; excerptId: string }> {
  return apiFetch<{ success: true; excerptId: string }>(
    `/research/projects/${projectId}/sources/${sourceId}/excerpts/${excerptId}`,
    {
      method: "DELETE",
    },
  );
}

export function createResearchThread(
  apiFetch: ApiFetch,
  projectId: string,
  input: CreateResearchThreadInput,
): Promise<ResearchThreadRecord> {
  return apiFetch<ResearchThreadRecord>(
    `/research/projects/${projectId}/threads`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function createResearchMessage(
  apiFetch: ApiFetch,
  projectId: string,
  threadId: string,
  input: CreateResearchMessageInput,
): Promise<ResearchMessageRecord> {
  return apiFetch<ResearchMessageRecord>(
    `/research/projects/${projectId}/threads/${threadId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function generateResearchAssistantReply(
  apiFetch: ApiFetch,
  projectId: string,
  threadId: string,
  input: GenerateResearchAssistantReplyInput,
): Promise<ResearchAssistantReplyResult> {
  return apiFetch<ResearchAssistantReplyResult>(
    `/research/projects/${projectId}/threads/${threadId}/assistant`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function createResearchCitation(
  apiFetch: ApiFetch,
  projectId: string,
  threadId: string,
  messageId: string,
  input: CreateResearchCitationInput,
): Promise<ResearchCitationRecord> {
  return apiFetch<ResearchCitationRecord>(
    `/research/projects/${projectId}/threads/${threadId}/messages/${messageId}/citations`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function createResearchMindMapNode(
  apiFetch: ApiFetch,
  projectId: string,
  input: CreateResearchMindMapNodeInput,
): Promise<ResearchMindMapNodeRecord> {
  return apiFetch<ResearchMindMapNodeRecord>(
    `/research/projects/${projectId}/nodes`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateResearchMindMapNode(
  apiFetch: ApiFetch,
  projectId: string,
  nodeId: string,
  input: UpdateResearchMindMapNodeInput,
): Promise<ResearchMindMapNodeRecord> {
  return apiFetch<ResearchMindMapNodeRecord>(
    `/research/projects/${projectId}/nodes/${nodeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteResearchMindMapNode(
  apiFetch: ApiFetch,
  projectId: string,
  nodeId: string,
): Promise<{ success: true; nodeId: string }> {
  return apiFetch<{ success: true; nodeId: string }>(
    `/research/projects/${projectId}/nodes/${nodeId}`,
    {
      method: "DELETE",
    },
  );
}

export function createResearchMindMapEdge(
  apiFetch: ApiFetch,
  projectId: string,
  input: CreateResearchMindMapEdgeInput,
): Promise<ResearchMindMapEdgeRecord> {
  return apiFetch<ResearchMindMapEdgeRecord>(
    `/research/projects/${projectId}/edges`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function deleteResearchMindMapEdge(
  apiFetch: ApiFetch,
  projectId: string,
  edgeId: string,
): Promise<{ success: true; edgeId: string }> {
  return apiFetch<{ success: true; edgeId: string }>(
    `/research/projects/${projectId}/edges/${edgeId}`,
    {
      method: "DELETE",
    },
  );
}
