import {
  Controller,
  Get,
} from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getApiInformation() {
    return {
      name: "AIMERS OS API",
      version: "0.1.0",
      status: "running",

      endpoints: {
        health:
          "/api/v1/health",

        liveness:
          "/api/v1/health/live",

        readiness:
          "/api/v1/health/ready",
      },
    };
  }
}
