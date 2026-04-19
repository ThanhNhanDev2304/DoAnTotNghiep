import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import ConfigSwagger from '@/lib/swagger/configSwagger';
import { ValidationPipe, VersioningType, BadRequestException, ClassSerializerInterceptor } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService: ConfigService = app.get(ConfigService);

  ConfigSwagger.setup(app);

  const reflector: Reflector = app.get(Reflector);
  const globalPrefix = 'api';
  const version = '1';
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: `${version}`,
  }); 

  // Apply Global ClassSerializerInterceptor to use Entity classes for response transformation
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // Custom Validation Pipe with error formatting and automatic transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //tự động loại bỏ các thuộc tính không được định nghĩa trong DTOs
      forbidNonWhitelisted: true, //nếu có thuộc tính không được định nghĩa trong DTO thì sẽ ném ra lỗi
      transform: true, //tự động chuyển đổi payload thành các instance của lớp DTO

      exceptionFactory: (errors) => { // tuyến bố một factory để tạo ra lỗi tùy chỉnh khi validation thất bại
        // Format validation errors
        const formattedErrors = errors.map((error) => ({
          field: error.property, // Tên của trường bị lỗi
          messages: Object.values(error.constraints || {}), // Các thông báo lỗi liên quan đến trường đó
        }));
        throw new BadRequestException({ // Trả về một đối tượng lỗi có cấu trúc rõ ràng
          statusCode: 400, // Mã lỗi HTTP
          message: 'Validation failed', // Thông báo lỗi chung
          errors: formattedErrors
        });
      },
    }),
  );

  // You can add global guards here if needed when you call request handler, it will check if the route is public or not, if not it will check the token and validate it before calling the handler
  // app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Add cookie-parser middleware to handle cookies in requests and responses, which is essential for managing refresh tokens stored in cookies.
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000).then((app) => {
    console.log(`Application is running on: http://${configService.get<string>('HOST')}:${configService.get<number>('PORT')}/${globalPrefix}/v${version}`);
    console.log(
      `Swagger is running on: http://${configService.get<string>('HOST')}:${configService.get<number>('PORT')}/swagger`,
    );
  });
}
bootstrap();
