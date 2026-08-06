import type {
  AiMentorWorkspace,
  ApiFetch,
  GenerateMentorBriefResponse,
  SendMentorMessageResponse,
} from "./ai-mentor.types";

export function getAiMentorWorkspace(
  apiFetch:
    ApiFetch,
  timezone:
    string,
) {
  return apiFetch<
    AiMentorWorkspace
  >(
    `/ai-mentor/workspace?timezone=${encodeURIComponent(timezone)}`,
  );
}

export function sendMentorMessage(
  apiFetch:
    ApiFetch,
  conversationId:
    string,
  content:
    string,
) {
  return apiFetch<
    SendMentorMessageResponse
  >(
    "/ai-mentor/messages",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          conversationId,
          content,
        }),
    },
  );
}

export function generateMentorBrief(
  apiFetch:
    ApiFetch,
  timezone:
    string,
) {
  return apiFetch<
    GenerateMentorBriefResponse
  >(
    "/ai-mentor/brief",
    {
      method:
        "POST",
      body:
        JSON.stringify({
          timezone,
          force:
            true,
        }),
    },
  );
}

export function respondToMentorCheckIn(
  apiFetch:
    ApiFetch,
  checkInId:
    string,
  payload: {
    answer:
      string;
    selectedOption?:
      string;
    energyScore?:
      number;
    focusScore?:
      number;
    moodScore?:
      number;
  },
) {
  return apiFetch<{
    success:
      boolean;
  }>(
    `/ai-mentor/check-ins/${checkInId}/respond`,
    {
      method:
        "POST",
      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}
