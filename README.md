<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


# # <span style="color:red">The library materials used for this project are below.</span>

## 1 Use Prisma/client with DB on Cloud [console.prisma.io](https://console.prisma.io/) for NestJS

```bash
  npm install @prisma/client
  npx prisma init
```
- After installing and setting up Prisma, we proceed to retrieve the DATABASE_URL from this [page](https://console.prisma.io).
- Write the table structure for the database in the schema.prisma file, and then run the command below to generate the client code.
```bash
  npx prisma generate
```

- Now we create resources for the nest with services and modules using the command below.
```bash
  nest g module prisma
  nest g service prisma
```
- It will create two files, `prisma.module.ts` and `prisma.service.ts`, inside the prisma directory.
- In the `prisma.module.ts` file, write it according to the following structure below.
```bash
  import { Global, Module } from '@nestjs/common';
  import { PrismaService } from '@/prisma/prisma.service';

  @Global() // Make PrismaModule global so that PrismaService can be injected anywhere without needing to import PrismaModule
  @Module({
    imports: [],
    providers: [PrismaService],
    exports: [PrismaService], // Export PrismaService so it can be used in other modules that import PrismaModule
  })
  export class PrismaModule {}
```
- And the file `prisma.service.ts` is also written as follows.
```bash
  import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import {  } from '@prisma/client';
  import { PrismaClient } from '@prisma/client';

  @Injectable()
  export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
      constructor(
          private readonly configService: ConfigService
      ) {
          const databaseUrl = configService.get<string>('DATABASE_URL');
          if (!databaseUrl) {
              throw new Error('DATABASE_URL environment variable is not set. Please set it to your Prisma Data API URL !!!');
          }
          super({ accelerateUrl: databaseUrl });
      }
      
      private readonly logger = new Logger(PrismaService.name);

      async onModuleInit() {
          try {
              await this.$connect();
              this.logger.log('✅ Prisma connected to PostgreSQL successfully');
          } catch (error: any) {
              this.logger.error('❌ Prisma connection failed:', error);
              throw error;
          }
      }

      async onModuleDestroy() {
          await this.$disconnect();
          this.logger.log('✅ Prisma disconnected from PostgreSQL');
      }
  }
```


## 2 Configure Swagger OpenAPI Documentation, [see details here](https://docs.nestjs.com/openapi/introduction)
- Swagger file configuration
```bash
  import { NestExpressApplication } from '@nestjs/platform-express';
  import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

  //config swagger
  export default class ConfigSwagger {
      public static setup = (app: NestExpressApplication): void => {
          const config = new DocumentBuilder()
              .setTitle('ToDoList API')
              .setDescription('The ToDoList API description')
              .setVersion('1.0')
              .addBearerAuth({
                  type: 'http',
                  scheme: 'Bearer',
                  bearerFormat: 'JWT',
                  in: 'header',
              }, 'access-token')
              .addSecurityRequirements('access-token')
              .build();
          const documentFactory = () => SwaggerModule.createDocument(app, config);
          SwaggerModule.setup('swagger', app, documentFactory, { //route swagger http://localhost:3000/swagger
              swaggerOptions: {
                  persistAuthorization: true, //keep authorization token after refresh page and f5
              },
          });
      }
  }
```
- In the `main.ts` file, call the following function to use it.
```bash
  ConfigSwagger.setup(app);
```

## 3 `Validate` the data we need to load additional libraries (you can refer to [here](https://docs.nestjs.com/techniques/validation)):
```bash
  npm i --save class-validator class-transformer
```
- All details can be found [here](https://docs.nestjs.com/techniques/validation).
- To use the library, you need to declare it in `main.ts` as shown in the example below and format the message for BadRequestException:
```bash
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
```

# 4 Add `debug` code to NestJS with visual code:
- Create a `launch.json` file of the `visual code` and modify the components as shown below:
```bash
 "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Nest Debug",
            "runtimeExecutable": "npm",
            "runtimeArgs": [
                "run",
                "start:debug",
                "--",
                "--inspect-brk"
            ],
            "console": "integratedTerminal",
            "restart": true,
            "protocol": "auto",
            "port": 9229,
            "autoAttachChildProcesses": true
        }
    ]
```



