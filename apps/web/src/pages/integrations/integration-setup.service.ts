import type {
  ApiFetch,
  ConnectorSetupStartResult,
  ConnectorSetupWorkspace,
} from "./integration-setup.types";

export function getConnectorSetupWorkspace(
  apiFetch:
    ApiFetch,
) {
  return apiFetch<
    ConnectorSetupWorkspace
  >(
    "/connector-setup",
  );
}

export function startConnectorSetup(
  apiFetch:
    ApiFetch,
  connectorId:
    string,
) {
  return apiFetch<
    ConnectorSetupStartResult
  >(
    `/connector-setup/${connectorId}/start`,
    {
      method:
        "POST",
    },
  );
}

export function retryConnectorSetup(
  apiFetch:
    ApiFetch,
  connectorId:
    string,
) {
  return apiFetch<
    ConnectorSetupStartResult
  >(
    `/connector-setup/${connectorId}/retry`,
    {
      method:
        "POST",
    },
  );
}
