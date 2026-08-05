import type {
  ApiFetch,
  ActivityOverview,
  DigitalActivityWorkspace,
  IntelligenceDashboard,
} from "./digital-activity.types";

export async function getDigitalActivityWorkspace(
  apiFetch: ApiFetch,
  days: number,
): Promise<DigitalActivityWorkspace> {
  const [
    overview,
    intelligence,
  ] = await Promise.all([
    apiFetch<ActivityOverview>(
      `/activity/overview?days=${days}`,
    ),

    apiFetch<IntelligenceDashboard>(
      `/intelligence/dashboard?days=${days}&limit=20`,
    ),
  ]);

  return {
    overview,
    intelligence,
  };
}
