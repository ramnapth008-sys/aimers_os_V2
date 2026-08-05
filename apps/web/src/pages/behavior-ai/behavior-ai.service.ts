import type {
  ApiFetch,
  BehaviorOverview,
  BehaviorWorkspace,
  GenerateInterventionsResponse,
  Intervention,
  InterventionResponseType,
  RespondToInterventionResponse,
} from "./behavior-ai.types";

export async function getBehaviorWorkspace(
  apiFetch: ApiFetch,
  days: number,
): Promise<BehaviorWorkspace> {
  const [
    overview,
    interventions,
  ] = await Promise.all([
    apiFetch<BehaviorOverview>(
      `/behavior/overview?days=${days}`,
    ),

    apiFetch<Intervention[]>(
      "/interventions?limit=50",
    ),
  ]);

  return {
    overview,
    interventions,
  };
}

export function generateInterventions(
  apiFetch: ApiFetch,
): Promise<GenerateInterventionsResponse> {
  return apiFetch<GenerateInterventionsResponse>(
    "/interventions/generate",
    {
      method: "POST",
      body: JSON.stringify({
        limit: 20,
      }),
    },
  );
}

export function respondToIntervention(
  apiFetch: ApiFetch,
  interventionId: string,
  responseType: InterventionResponseType,
): Promise<RespondToInterventionResponse> {
  return apiFetch<RespondToInterventionResponse>(
    `/interventions/${interventionId}/respond`,
    {
      method: "POST",
      body: JSON.stringify({
        responseType,
      }),
    },
  );
}
