import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import ConfigSwagger from '@/config/swagger.config';
import { ClassSerializerInterceptor } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { JwtAuthGuard } from '@/lib/passport/jwt-auth.guard';
import { setupCors } from '@/config/cors.config';
import { validationConfig } from '@/config/validation.config';
import { setupAppConfig } from '@/config/app.config';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  const reflector: Reflector = app.get(Reflector);

  // Apply Global ClassSerializerInterceptor to use Entity classes for response transformation
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new LoggingInterceptor(),
    new TransformInterceptor()
  );

  // Apply Global Exception Filter to handle all uncaught exceptions in a centralized manner
  app.useGlobalFilters(
    new AllExceptionsFilter()
  );

  if (configService.get<string>('MODE') === 'development') {
    ConfigSwagger.setup(app);
    console.log('Swagger documentation is enabled in development mode');
  };

  // setup the versioning and global prefix for all routes
  const { globalPrefix, version } = setupAppConfig(app);

  // Custom Validation Pipe with error formatting and automatic transformation
  validationConfig(app);

  // You can add global guards here if needed when you call request handler, it will check if the route is public or not, if not it will check the token and validate it before calling the handler
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Add cookie-parser middleware to handle cookies in requests and responses, which is essential for managing refresh tokens stored in cookies.
  app.use(cookieParser());

  // Call the CORS setup function to configure CORS for the application
  setupCors(app);


  await app.listen(configService.get<number>('PORT') ?? 3000).then((app) => {
    console.log(`Application is running on: http://${configService.get<string>('HOST')}:${configService.get<number>('PORT')}/${globalPrefix}/v${version}`);
    console.log(
      `Swagger is running on: http://${configService.get<string>('HOST')}:${configService.get<number>('PORT')}/swagger`,
    );
  });
}
bootstrap();
