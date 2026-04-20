import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

//config swagger
export default class ConfigSwagger {
    public static setup = (app: NestExpressApplication): void => {
        const configService: ConfigService = app.get(ConfigService);
        const config = new DocumentBuilder()
            .setTitle('Project')
            .setDescription('The Project API description')
            .setVersion(`version ${configService.get<string>('VERSION')}`)
            .addBearerAuth({
                type: 'http',
                scheme: 'Bearer',
                bearerFormat: 'JWT',
                in: 'header',
            }, 'access-token')
            .addSecurityRequirements('access-token')
            .build();
        const documentFactory = () => SwaggerModule.createDocument(app, config, {
            deepScanRoutes: false, // Automatically scan all routes in the application, including those defined in modules and controllers, to generate comprehensive API documentation.
        });
        SwaggerModule.setup('swagger', app, documentFactory, { //route swagger http://localhost:3000/swagger
            swaggerOptions: {
                persistAuthorization: true, //keep authorization token after refresh page and f5
            },
        });
    }
}