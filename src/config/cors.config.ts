import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";

export const setupCors = (app: NestExpressApplication) => {
  const configService: ConfigService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('LIST_ORIGIN_CORS')?.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
};