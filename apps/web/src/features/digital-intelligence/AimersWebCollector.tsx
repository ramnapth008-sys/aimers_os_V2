import {
  useAuth,
} from "@aimers/auth";

import {
  useEffect,
  useRef,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import {
  AimersWebCollectorRuntime,
} from "./aimers-web-collector.runtime";

export function AimersWebCollector() {
  const {
    apiFetch,
    status,
  } = useAuth();

  const location =
    useLocation();

  const runtimeRef =
    useRef<
      AimersWebCollectorRuntime |
      null
    >(null);

  useEffect(() => {
    if (
      status !==
      "authenticated"
    ) {
      return;
    }

    // AIMERS_CONSENT_GATED_WEB_COLLECTOR_V1
    const runtime =
      new AimersWebCollectorRuntime(
        apiFetch,
      );

    runtimeRef.current =
      runtime;

    runtime.updateRoute({
      pathname:
        location.pathname,

      search:
        location.search,

      hash:
        location.hash,

      pageTitle:
        document.title,
    });

    runtime.start();

    return () => {
      runtime.stop();

      runtimeRef.current =
        null;
    };
  }, [
    apiFetch,
    status,
  ]);

  useEffect(() => {
    runtimeRef
      .current
      ?.updateRoute({
        pathname:
          location.pathname,

        search:
          location.search,

        hash:
          location.hash,

        pageTitle:
          document.title,
      });
  }, [
    location.hash,
    location.pathname,
    location.search,
  ]);

  return null;
}
