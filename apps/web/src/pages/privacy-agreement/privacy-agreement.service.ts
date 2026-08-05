import type {
  AcceptPrivacyAgreementInput,
  AcceptPrivacyAgreementResponse,
  PrivacyAgreementWorkspace,
} from "./privacy-agreement.types";

type ApiFetch =
  <T>(
    path: string,
    init?: RequestInit,
  ) => Promise<T>;

export function getPrivacyAgreement(
  apiFetch:
    ApiFetch,
) {
  return apiFetch<
    PrivacyAgreementWorkspace
  >(
    "/privacy-agreement",
  );
}

export function acceptPrivacyAgreement(
  apiFetch:
    ApiFetch,
  input:
    AcceptPrivacyAgreementInput,
) {
  return apiFetch<
    AcceptPrivacyAgreementResponse
  >(
    "/privacy-agreement/accept",
    {
      method: "POST",

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}
