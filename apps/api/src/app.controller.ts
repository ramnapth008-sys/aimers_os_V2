import {
  Controller,
  Get,
} from "@nestjs/common";

import {
  Public,
} from "./auth/decorators/public.decorator";

@Controller()
export class AppController {
  @Public()
  @Get()
  getApiInformation() {
    return {
      name:
        "AIMERS OS API",

      version:
        "0.2.0",

      status:
        "running",

      endpoints: {
        health:
          "/api/v1/health",

        registration:
          "/api/v1/auth/register",

        login:
          "/api/v1/auth/login",

        refresh:
          "/api/v1/auth/refresh",

        logout:
          "/api/v1/auth/logout",

        currentUser:
          "/api/v1/auth/me",
      },
    };
  }
}
