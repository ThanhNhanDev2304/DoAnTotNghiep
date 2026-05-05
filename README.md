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

## 9 Send Email with Nodemailer and EJS Template

- First, install the required libraries:
```bash
  npm install nodemailer ejs
  npm install -D @types/nodemailer @types/ejs
```

- Create Email module using NestJS CLI:
```bash
  nest g module email
  nest g service email
  nest g controller email
```

- **Step 1: Create Email Module** (`email.module.ts`)

The module should look like this:

```typescript
  import { Module } from '@nestjs/common';
  import { EmailService } from './email.service';
  import { EmailController } from './email.controller';

  @Module({
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService], // Export so other modules can use it
  })
  export class EmailModule {}
```

- **Step 2: Create Email Service** (`email.service.ts`)

The service handles email sending with Nodemailer:

```typescript
  import { Injectable, Logger } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import nodemailer from 'nodemailer';
  import ejs from 'ejs';
  import path from 'path';

  @Injectable()
  export class EmailService {
      private readonly logger = new Logger(EmailService.name);
      private readonly transporter: nodemailer.Transporter;
      private readonly appName: string;
      private readonly supportEmail: string;
      private readonly fromEmail: string;

      constructor(private readonly configService: ConfigService) {
          const host = this.configService.get<string>('EMAIL_HOST');
          const port = Number(this.configService.get<string>('EMAIL_PORT') || '587');
          const authUser = this.configService.get<string>('EMAIL_AUTH_USER');
          const authPass = this.configService.get<string>('EMAIL_AUTH_PASS');
          this.fromEmail = this.configService.get<string>('EMAIL_FROM')!;
          this.supportEmail = this.configService.get<string>('SUPPORT_EMAIL')!;
          this.appName = this.configService.get<string>('APP_NAME') || 'Project UMC';

          if (!host || !port || !authUser || !authPass || !this.fromEmail || !this.supportEmail) {
              throw new Error('Missing email configuration in environment variables');
          }

          this.transporter = nodemailer.createTransport({
              host,
              port,
              secure: false, // true for 465, false for other ports
              auth: {
                  user: authUser,
                  pass: authPass,
              },
          });
      }

      // Send OTP verification email
      async sendRegisterOtp(
          email: string,
          userName: string,
          otp: string,
          expireText: string,
      ): Promise<void> {
          const templatePath = path.join(
              process.cwd(),
              'src',
              'email',
              'templates',
              'register-otp.ejs',
          );
          
          // Render EJS template with data
          const html = await ejs.renderFile(templatePath, {
              appName: this.appName,
              supportEmail: this.supportEmail,
              userName,
              otp,
              expireText,
          });

          const info = await this.transporter.sendMail({
              from: this.fromEmail,
              to: email,
              subject: `${this.appName} - OTP Verification`,
              html,
          });

          this.logger.log(`OTP email sent successfully: ${info.messageId}`);
      }

      // Send test email (for verification)
      async sendTestEmail(toEmail: string): Promise<void> {
          const info = await this.transporter.sendMail({
              from: this.fromEmail,
              to: toEmail,
              subject: `${this.appName} - Test Email`,
              html: `
                <div style="font-family:Arial,sans-serif;padding:24px">
                  <h2>Test email sent successfully</h2>
                  <p>If you received this email, your SMTP setup is working.</p>
                </div>
              `,
          });

          this.logger.log(`Test email sent successfully: ${info.messageId}`);
      }
  }
```

- **Step 3: Add Environment Variables** (`.env`)

Add these configurations for email service:

```env
  EMAIL_HOST="smtp.gmail.com"
  EMAIL_PORT=587
  EMAIL_AUTH_USER="your_email@gmail.com"
  EMAIL_AUTH_PASS="your_app_password"  # NOT your regular Gmail password
  EMAIL_FROM="Project UMC <your_email@gmail.com>"
  SUPPORT_EMAIL="support@yourdomain.com"
  APP_NAME="Project UMC"
```

**To get Gmail App Password:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable `2-Step Verification`
3. Find `App passwords`
4. Select "Mail" and "Windows Computer" (or your OS)
5. Copy the generated password to `EMAIL_AUTH_PASS`

- **Step 4: Create DTOs** (`email/dto/create-email.dto.ts`)

```typescript
  import { ApiProperty } from '@nestjs/swagger';
  import { IsEmail, IsNotEmpty } from 'class-validator';

  export class SendEmailDto {
    @ApiProperty({ description: 'Email address to receive test email', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    toEmail!: string;
  }

  export class TestSendRegisterOtpDto {
    @ApiProperty({ description: 'User email', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ description: 'Username', example: 'John Doe' })
    @IsNotEmpty()
    userName!: string;

    @ApiProperty({ description: 'OTP code', example: '123456' })
    @IsNotEmpty()
    otp!: string;

    @ApiProperty({ description: 'Expiration message', example: 'Code expires in 10 minutes' })
    @IsNotEmpty()
    expireText!: string;
  }
```

- **Step 5: Create Email Controller** (`email.controller.ts`)

```typescript
  import { Body, Controller, Post } from '@nestjs/common';
  import { EmailService } from './email.service';
  import { Public } from '@/lib/decorator/metadata';
  import { ApiOperation } from '@nestjs/swagger';
  import { SendEmailDto, TestSendRegisterOtpDto } from './dto/create-email.dto';

  @Controller('email')
  export class EmailController {
      constructor(private readonly emailService: EmailService) {}

      @Public()
      @ApiOperation({ summary: 'Send a test email to verify email configuration' })
      @Post('test-email')
      async testEmail(@Body() body: SendEmailDto) {
          await this.emailService.sendTestEmail(body.toEmail);
          return { message: 'Test email sent successfully' };
      }

      @Public()
      @ApiOperation({ summary: 'Send a registration OTP email to a user' })
      @Post('send-register-otp')
      async sendRegisterOtp(@Body() body: TestSendRegisterOtpDto) {
          await this.emailService.sendRegisterOtp(
              body.email,
              body.userName,
              body.otp,
              body.expireText,
          );
          return { message: 'Registration OTP email sent successfully' };
      }
  }
```

- **Step 6: Create EJS Email Template** (`email/templates/register-otp.ejs`)
Create a folder named `email/templates/` and add the HTML email template, such as the register-otp.ejs file in the GitHub source.

- **Step 7: Use Email Service in Auth Module**
In your `auth.service.ts`, inject and use the EmailService:

```typescript
  import { EmailService } from '@/email/email.service';

  @Injectable()
  export class AuthService {
      constructor(
          private readonly emailService: EmailService,
          // ... other dependencies
      ) {}

      async register(registerDto: RegisterDto): Promise<any> {
          // Your registration logic...

          // Generate OTP
          const otp = generateNumericOtp(6);
          const expireTime = ms(this.otpExpire) / 1000 / 60; // Convert to minutes

          // Send OTP email
          await this.emailService.sendRegisterOtp(
              registerDto.email,
              registerDto.userName,
              otp,
              `Mã OTP sẽ hết hạn sau ${expireTime} phút`,
          );

          // Rest of your logic...
      }
  }
```

- **Step 8: Test Email Configuration**

Use Swagger or Postman to test:

```http
  POST /api/v1/email/test-email
  Content-Type: application/json

  {
      "toEmail": "your_email@gmail.com"
  }
```

Expected response:
```json
  {
      "message": "Test email sent successfully"
  }
```

- **Step 9: Creating Custom Email Templates**

To create additional email templates:

1. Create new `.ejs` file in `email/templates/`:
   ```bash
     email/templates/
     ├── register-otp.ejs          # OTP verification
     ├── password-reset.ejs        # Password reset (example)
     └── welcome.ejs               # Welcome email (example)
   ```

2. Add method in `EmailService`:
   ```typescript
     async sendPasswordReset(email: string, resetLink: string): Promise<void> {
         const templatePath = path.join(
             process.cwd(),
             'src',
             'email',
             'templates',
             'password-reset.ejs',
         );

         const html = await ejs.renderFile(templatePath, {
             appName: this.appName,
             supportEmail: this.supportEmail,
             resetLink,
         });

         await this.transporter.sendMail({
             from: this.fromEmail,
             to: email,
             subject: `${this.appName} - Reset Your Password`,
             html,
         });
     }
   ```

3. Call in appropriate service (e.g., AuthService for password reset)

- **Step 10: Email Module Import**

Make sure EmailModule is imported in `app.module.ts`:

```typescript
  import { EmailModule } from '@/email/email.module';

  @Module({
    imports: [
      // ... other modules
      EmailModule,
    ],
  })
  export class AppModule {}
```

**Key Points:**

- Email service uses Nodemailer for SMTP configuration
- EJS templates allow dynamic content injection
- OTP emails include expiration time and support contact
- Test email endpoint helps verify SMTP setup
- Templates follow Apple-style email design for better appearance
- Service is exported from module for use in other modules
- All email methods are logged for debugging

## 10 Add Redis Cache with NestJS and Prisma
- With redis I will use serverless database service from Upstash, you can create a Redis database on Upstash and get the connection URL to use in your NestJS application.
- First, install the required libraries:
```bash
  pnpm i @upstash/redis
  pnpm add -D @types/jest
```
- Create a new module for Redis:
```bash
  nest g module redis
  nest g service redis
```

- Testing for project, we need to install some libraries:
```bash
  pnpm add -D @types/jest
```
and setup tsconfig for testing in `tsconfig.json`:
```json
  {
    "compilerOptions": {
      // ... other options
      "types": ["jest", "node"]
    }
  }
```
