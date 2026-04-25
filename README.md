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


# ![NOTE](https://img.shields.io/badge/NOTE-Important-orange) The library materials used for this project are below.

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

- If you want to connect PostgreSQL with DBeaver, follow the instructions below:
  ### - 1: After obtaining the Prisma connection URL like this: `postgres://<username>:<password>@db.prisma.io:5432/postgres?sslmode=require`
  ### - 2: In DBeaver, establish a connection with PostgreSQL, change Connect by from `Host` to `URL` and fill in the information below: ***jdbc:postgresql://***`db.prisma.io:5432/postgres?sslmode=require`
    - With `jdbc:postgresql://`: DBeaver uses the Java PostgreSQL driver, so the link starts with this.
    - And `db.prisma.io:5432/postgres?sslmode=require`: This is the component taken from after the @ symbol in the previously obtained prisma connect URL link.
  ### - 3: For the username and password sections, enter the key obtained from the Prisma URL above, following the tag formats mentioned earlier.

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

## 4 Add `debug` code to NestJS with visual code:
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

## 5 Set up authentication users for the [NestJS Passport](https://docs.nestjs.com/recipes/passport#authentication-requirements) library.

- We will create a resource for authentication.
```bash
  nest g resource auth
```

- Create the file auth/`local-auth.guard.ts`
```bash

  import { Injectable } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';

  @Injectable()
  export class LocalAuthGuard extends AuthGuard('local') {

  }
```

- Install the lib Passport for Project
```bash
  npm install --save @nestjs/passport passport passport-local ms cookie-parser @nestjs/jwt passport-jwt
  npm install --save-dev @types/passport-local @types/passport-jwt @types/ms @types/cookie-parser
```

- Add the following code to `main.ts`
```bash
    app.useGlobalGuards(new JwtAuthGuard(reflector)); 
    app.use(cookieParser());
```

## 6 Debug NestJS with Visual code
- Create a **.vscode** folder in the root directory and create a **`launch.json`** file in the **.vscode** folder with the content as shown below.
```bash
  {
      // Use IntelliSense to learn about possible attributes.
      // Hover to view descriptions of existing attributes.
      // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
      "version": "0.2.0",
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
  }
```

## 7 Connect With Supabase Storage Save Image for project
- You need to download the Supabase library to be able to use it.
```bash
  npm i @supabase/supabase-js multer
  npm i -D @types/multer
```
- Next, go to the `Integrations` section in Supabase, select `Data API`, and copy the `API_URL` (excluding the components after `.co`) into your .env file using the `SUPABASE_URL` variable.

## 8 Login with Passport google oauth20
- First we need install two library
```bash
  npm install passport-google-oauth20
  npm install -D @types/passport-google-oauth20
```
- **Step 1: Obtain Google Credentials**

1. Access the Google Cloud Console (https://console.cloud.google.com/).

2. Create a new project or select an existing one.

3. Open APIs & Services > OAuth consent screen to set up the consent screen (Select External and fill in the required information).

4. Switch to the Credentials tab > Click Create Credentials > Select OAuth client ID.

5. Application type: Select Web application.

6. Authorized JavaScript origins: Add the frontend URL (e.g., `http://localhost:5173`).

7. Authorized redirect URIs: Add the backend callback URL. NOTE: Must include the full Global Prefix and Version (e.g., `http://localhost:3000/api/v1/auth/google/callback`).

8. Click **Create**, then copy the `Client ID` and `Client Secret`.

- **Step 2: Configure environment variables (.env)**
Open the `.env` file and fill in the parameters you just obtained:
```env
  GOOGLE_CLIENT_ID=paste_your_client_id_here
  GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
  GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
```

- **Step 3: Frontend Integration Instructions**
Because the backend requires a `deviceId` stored in a **cookie** at the callback function, the frontend must proactively create and store this cookie **before** redirecting to the Google login page.

Sample code for the "Login with Google" button in the frontend:

```javascript
  const handleGoogleLogin = () => {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('deviceId', deviceId);
        }

        document.cookie = `deviceId=${deviceId}; path=/; max-age=31536000`; // Lưu trong 1 năm

        window.location.href = "http://localhost:3000/api/v1/auth/google";
    };
```
- **Step 4: Set up login with google oauth20**
In the `passport` directory of the auth application, create a new folder named `google` and then create a file inside that folder with the name `google.strategy.ts` and use the sample code below!
```typescript
  import { PassportStrategy } from '@nestjs/passport';
  import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import type { GoogleUser } from '@/auth/passport/google/google-user.interface';

  @Injectable()
  export class GoogleStrategy extends PassportStrategy(
      Strategy,
      'google',
  ) {
      constructor(
          private readonly configService: ConfigService,
      ) {
          super({
              clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
              clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
              callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
              scope: ['email', 'profile'],
          });
      }

      async validate(
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: VerifyCallback,
      ): Promise<any> {
          const user: GoogleUser = {
              email: profile.emails?.[0]?.value || '',
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value || null,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
          };

          done(null, user);
      }
  }
```
and create another file in the same directory with the name `google-user.interface.ts` with the sample code below!
```typescript
  export interface GoogleUser {
      email: string;
      googleId: string;
      avatar?: string | null;
      firstName?: string | null;
      lastName?: string | null;
  }
```
and another file, `google-auth.guard.ts`, in the lib/passport directory. with the sample code below!
```typescript
  import { Injectable } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';

  @Injectable()
  export class GoogleAuthGuard extends AuthGuard('google') { }
```




