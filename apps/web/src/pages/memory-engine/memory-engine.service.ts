import type {
  ApiFetch,
  MemoryEngineWorkspace,
} from "./memory-engine.types";

export function getMemoryEngineWorkspace(
  apiFetch: ApiFetch,
): Promise<MemoryEngineWorkspace> {
  return apiFetch<MemoryEngineWorkspace>(
    "/memory-engine/me",
  );
}
