# Setup Instructions

File này ghi lại toàn bộ các bước setup project từ đầu đến trạng thái hiện tại để sau này có thể dựng lại backend mà không bị thiếu bước.

## 1 Tổng quan công nghệ sử dụng

Project hiện tại dùng:

- `NestJS` - Framework backend
- `Prisma` - ORM để quản lý database
- `PostgreSQL` - Database chính
- `JWT access token + refresh token` - Xác thực người dùng
- `Passport local + passport-google-oauth20` - Chiến lược đăng nhập
- `Supabase Storage` - Lưu trữ file (avatar, background)
- `OTP email verification` - Xác minh email qua mã OTP
- `Scheduler` - Dọn dẹp session/OTP hết hạn tự động

**Các chức năng chính đang có:**

- Đăng ký tài khoản bằng OTP qua email
- Xác minh OTP để tạo tài khoản thật
- Đăng nhập local (email/username + password)
- Refresh token bằng cookie (multi-device)
- Logout / Logout all session
- Đăng nhập với Google OAuth
- Upload avatar/background lên Supabase Storage
- Seed database khi khởi động app
- Role-based access control (RBAC)
- Scheduled cleanup jobs

## 2 Chuẩn bị môi trường

Máy cần có sẵn:

- `Node.js` bản LTS
- `pnpm` (package manager)
- `Git`
- tài khoản `Supabase` (để lưu file)
- tài khoản `Google Cloud Console` (nếu dùng Google login)
- tài khoản Gmail có bật `2-Step Verification` (để gửi OTP)

Kiểm tra nhanh:

```bash
node -v
pnpm -v
git --version
```

Nếu chưa có `pnpm`:

```bash
npm install -g pnpm
```

## 3 Clone project và cài package

```bash
git clone <repo-url>
cd Backend
pnpm install
```

## 4 Tạo file môi trường .env

Tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env  # Windows
# hoặc
cp .env.example .env     # macOS/Linux
```

Sau đó điền đầy đủ các biến môi trường theo các hướng dẫn phía dưới.

## 5 Cấu hình Prisma và kết nối Database

### 5.1 Cài đặt Prisma Client

```bash
pnpm install @prisma/client
npx prisma init
```

### 5.2 Lấy DATABASE_URL

- Vào [console.prisma.io](https://console.prisma.io/)
- Hoặc dùng PostgreSQL URL từ cloud provider của bạn

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
# hoặc
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### 5.3 Tạo Prisma Service cho NestJS

Hệ thống đã tạo sẵn Prisma Service. Để generate lại:

```bash
pnpm prisma generate
```

### 5.4 Chạy migrations

Nếu là lần đầu:

```bash
pnpm prisma migrate dev --name init
```

Nếu đã có migrations:

```bash
pnpm prisma migrate dev
```

### 5.5 Xem dữ liệu với Prisma Studio (tuỳ chọn)

```bash
pnpm prisma studio
```

Mở `http://localhost:5555` để xem/edit dữ liệu.

### 5.6 Kết nối DBeaver với Prisma PostgreSQL (tuỳ chọn)

- URL Prisma có dạng: `postgres://<user>:<pass>@db.prisma.io:5432/postgres?sslmode=require`
- Trong DBeaver, chuyển sang `URL` mode
- Điền: `jdbc:postgresql://db.prisma.io:5432/postgres?sslmode=require`
- Điền username/password từ Prisma URL

## 6 Cấu hình app cơ bản

Thêm vào file `.env`:

```env
MODE="development"          # development | production
HOST="localhost"
PORT=3000
VERSION="1"
GLOBAL_PREFIX="api"
```

Khi này:
- API sẽ chạy ở: `http://localhost:3000/api/v1/...`
- Swagger sẽ ở: `http://localhost:3000/swagger`

## 7 Cấu hình Swagger OpenAPI Documentation

Swagger đã được setup sẵn. Để tùy chỉnh:

- Config file: `src/config/swagger.config.ts`
- Gọi trong `src/main.ts`: `ConfigSwagger.setup(app);`

Swagger cho phép:
- Xem tất cả endpoints
- Test API trực tiếp (Try it out)
- Cấu hình authorization token
- Xem request/response schemas

Truy cập: `http://localhost:3000/swagger` khi app chạy

## 8 Cấu hình Data Validation

Project dùng `class-validator` và `class-transformer`:

```bash
pnpm install --save class-validator class-transformer
```

Đã được cấu hình trong `src/main.ts`:

```typescript
app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,              // Loại bỏ thuộc tính không khai báo
        forbidNonWhitelisted: true,   // Từ chối request có thuộc tính không khai báo
        transform: true,              // Chuyển đổi payload thành DTO instance

        exceptionFactory: (errors) => {
            // Format lỗi validation tùy chỉnh
            const formattedErrors = errors.map((error) => ({
                field: error.property,
                messages: Object.values(error.constraints || {}),
            }));
            throw new BadRequestException({
                statusCode: 400,
                message: 'Validation failed',
                errors: formattedErrors
            });
        },
    }),
);
```

Tất cả DTOs nằm trong thư mục `dto/` của mỗi module.

## 9 Cấu hình seed database

```env
SEED_DB=true                # Bật/tắt seed khi app start
CLEAR_DB=false              # Xóa dữ liệu cũ rồi seed lại (cẩn thận!)
NAME_ROLE_ADMIN="ADMIN"     # Tên role admin
NAME_ROLE_USER="USER"       # Tên role user
BCRYPT_SALT_ROUNDS=10       # Số vòng hash bcrypt
DEFAULT_PASSWORD="123456"   # Password mặc định cho seeded user
```

**Khi `SEED_DB=true` và `CLEAR_DB=true`, hệ thống sẽ:**

- Xóa toàn bộ dữ liệu các bảng: PendingRegistration, Session, File, User, Role
- Xóa toàn bộ file trong Supabase Storage bucket
- Tạo lại roles và users mặc định

**Thư mục seed:**

- `src/seed-db/seed-db.module.ts` - Module seed
- `src/seed-db/seed-db.service.ts` - Logic seed
- `src/seed-db/seed/` - Dữ liệu seed

## 10 Cấu hình JWT và Session

```env
JWT_ACCESS_TOKEN_SECRET="your_secret_key"
JWT_ACCESS_EXPIRE="10m"                    # Access token hết hạn sau 10 phút

JWT_REFRESH_TOKEN_SECRET="your_secret_key"
JWT_REFRESH_EXPIRE="1d"                    # Refresh token hết hạn sau 1 ngày

NUMBER_OF_DEVICES=3                        # Tối đa 3 thiết bị/user (phải > 0)
NAME_COOKIE_REFRESH_TOKEN_BROWSER="refreshToken"  # Tên cookie refresh token
LIST_ORIGIN_CORS="http://localhost:5173,http://localhost:3000"  # CORS origins
```

**Lưu ý:**

- `NUMBER_OF_DEVICES` phải là số nguyên dương, không được 0
- Refresh token lưu trong HTTP-only cookie
- Khi đăng nhập thiết bị mới vượt quá giới hạn, session cũ nhất sẽ bị xóa

**Flow Session:**

1. Đăng nhập → tạo Session + cookie refresh token
2. Access token hết hạn → dùng refresh token để lấy token mới
3. Refresh token hết hạn → phải đăng nhập lại
4. Chuyển thiết bị mới → tạo Session mới (xóa session cũ nhất nếu vượt giới hạn)

**Auth Guards:**

- `src/lib/passport/jwt-auth.guard.ts` - Bảo vệ endpoints yêu cầu JWT
- `src/lib/passport/local-auth.guard.ts` - Bảo vệ local login
- `src/lib/passport/google-auth.guard.ts` - Bảo vệ Google OAuth

## 11 Cấu hình Supabase Storage

```env
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="eyJxxx..."                   # Service role key hoặc API key
SUPABASE_NAME_BUCKET="your-bucket-name"
```

**Cách lấy:**

1. Vào [Supabase Dashboard](https://app.supabase.com/)
2. Chọn project
3. Vào `Settings` → `API`
4. Copy `Project URL` vào `SUPABASE_URL`
5. Copy `Service Role Key` vào `SUPABASE_KEY`
6. Vào `Storage` → tạo/chọn bucket, copy tên vào `SUPABASE_NAME_BUCKET`

**File Upload:**

- Service: `src/files/files.service.ts`
- Controller: `src/files/files.controller.ts`
- Hỗ trợ upload: avatar, background, và các file khác
- Cài multer: `pnpm install --save multer @types/multer`

**Lưu ý:**

- Khi `CLEAR_DB=true`, bucket Supabase sẽ bị xóa sạch
- File được tổ chức theo user ID

## 12 Cấu hình OTP đăng ký

```env
OTP_EXPIRE="5m"             # OTP hết hạn sau 5 phút
OTP_LENGTH=6                # Độ dài OTP (số chữ số)
OTP_MAX_ATTEMPTS=5          # Tối đa 5 lần nhập sai
```

**Flow OTP:**

1. `POST /auth/register` - gửi email, username, password
2. Hệ thống tạo OTP 6 chữ số, gửi email
3. User nhận OTP và submit: `POST /auth/verify-register-otp`
4. Nếu OTP đúng → tạo User thật
5. User có thể đăng nhập

**OTP Service:**

- `src/lib/otp/generate-otp.ts` - Generate OTP
- `src/auth/auth.service.ts` - Verify OTP logic

**Database Model (PendingRegistration):**

```typescript
model PendingRegistration {
  id              String
  email           String      @unique
  userName        String      @unique
  passwordHash    String
  otpHash         String      // OTP đã hash
  otpExpiresAt    DateTime    // Thời gian hết hạn
  attemptCount    Int         // Số lần nhập sai
  resendAfter     DateTime?   // Thời gian chờ trước khi gửi lại
  createdAt       DateTime
  updatedAt       DateTime
}
```

## 13 Cấu hình gửi email OTP

Project dùng `Nodemailer + EJS`:

```bash
pnpm install --save nodemailer ejs
pnpm install --save-dev @types/nodemailer @types/ejs
```

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_AUTH_USER="your_email@gmail.com"
EMAIL_AUTH_PASS="your_app_password"         # KHÔNG phải password Gmail thường
EMAIL_FROM="Project UMC <your_email@gmail.com>"
SUPPORT_EMAIL="your_email@gmail.com"
APP_NAME="Project UMC"
```

**Cách lấy Gmail App Password:**

1. Vào [Google Account Security](https://myaccount.google.com/security)
2. Bật `2-Step Verification`
3. Tìm `App passwords`
4. Tạo app password mới (chọn Mail & Windows Computer)
5. Copy password vào `EMAIL_AUTH_PASS`

**Lưu ý:** KHÔNG dùng password Gmail thường, phải dùng App Password

**Email Service:**

- Service: `src/email/email.service.ts`
- Controller: `src/email/email.controller.ts`
- Templates: `src/email/templates/`
- Template sẵn: `register-otp.ejs` (gửi OTP)

**Tạo email template mới:**

1. Tạo file `.ejs` trong `src/email/templates/`
2. Thêm method gửi trong `EmailService`
3. Dùng trong service cần thiết (ví dụ: AuthService)

## 14 Cấu hình Passport Authentication

Project dùng Passport.js với JWT + Local strategies:

```bash
pnpm install --save @nestjs/passport @nestjs/jwt passport passport-local passport-jwt
pnpm install --save-dev @types/passport-local @types/passport-jwt
```

**Auth Module:**

- Module: `src/auth/auth.module.ts`
- Service: `src/auth/auth.service.ts`
- Controller: `src/auth/auth.controller.ts`
- DTOs: `src/auth/dto/create-auth.dto.ts`

**Passport Strategies:**

- JWT Strategy: `src/auth/passport/jwt.strategy.ts`
- Local Strategy: `src/auth/passport/local.strategy.ts`

**API Endpoints:**

```http
POST /api/v1/auth/register              # Đăng ký (gửi OTP)
POST /api/v1/auth/verify-register-otp   # Xác minh OTP
POST /api/v1/auth/login                 # Đăng nhập local
POST /api/v1/auth/refresh               # Lấy access token mới
POST /api/v1/auth/logout                # Logout khỏi thiết bị này
POST /api/v1/auth/logout-all            # Logout tất cả thiết bị
```

## 15 Cấu hình Google OAuth 2.0

```env
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
```

**Cách lấy Google OAuth Credentials:**

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Google+ API (tìm kiếm "Google+ API")
4. Vào `APIs & Services` → `Credentials`
5. Click `Create Credentials` → `OAuth client ID`
6. Chọn `Web application`
7. Thêm Authorized URIs:
   - JavaScript origins: `http://localhost:5173`, `http://localhost:3000`
   - Redirect URIs: `http://localhost:3000/api/v1/auth/google/callback`
8. Copy Client ID và Client Secret

**Lưu ý:** Callback URL phải khớp 100%, bao gồm `/api/v1/auth/google/callback`

**Google OAuth Module:**

- Strategy: `src/auth/passport/google/google.strategy.ts`
- Interface: `src/auth/passport/google/google-user.interface.ts`
- Guard: `src/lib/passport/google-auth.guard.ts`

**API Endpoints:**

```http
GET /api/v1/auth/google             # Chuyển hướng tới Google login
GET /api/v1/auth/google/callback    # Google callback (xử lý tự động)
```

**Frontend Integration:**

Trước khi redirect tới Google login, frontend cần:

```javascript
const handleGoogleLogin = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('deviceId', deviceId);
    }

    // Lưu vào cookie (bắt buộc)
    document.cookie = `deviceId=${deviceId}; path=/; max-age=31536000`;

    // Redirect tới backend
    window.location.href = "http://localhost:3000/api/v1/auth/google";
};
```

## 16 Cấu hình Role-Based Access Control (RBAC)

```env
NAME_ROLE_ADMIN="ADMIN"     # Tên role admin
NAME_ROLE_USER="USER"       # Tên role user
```

**Role Module:**

- Module: `src/role/role.module.ts`
- Service: `src/role/role.service.ts`
- Controller: `src/role/role.controller.ts`
- Decorators: `src/lib/decorator/metadata.ts`

**Dùng Role để bảo vệ endpoints:**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    @Get()
    @Roles('ADMIN')  // Chỉ ADMIN có thể access
    getAdminData() {
        // Implementation
    }
}
```

## 17 Cấu hình Scheduled Jobs

Project dùng `@nestjs/schedule` để chạy task tự động:

```bash
pnpm install --save @nestjs/schedule
```

**Jobs Module:**

- Module: `src/jobs/jobs.module.ts`
- Service: `src/jobs/jobs.service.ts`

**Tasks chạy tự động:**

- Xóa OTP hết hạn từ bảng PendingRegistration
- Xóa Session hết hạn từ bảng Session
- Các maintenance tasks khác

**Ví dụ job:**

```typescript
@Cron(CronExpression.EVERY_HOUR)  // Chạy mỗi giờ
async cleanupExpiredOtps() {
    // Remove old OTP records
}
```

## 18 Debug NestJS với Visual Studio Code

Tạo file `.vscode/launch.json`:

```json
{
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

**Để start debug:**

1. Mở VS Code
2. Vào `Run and Debug` (Ctrl+Shift+D)
3. Chọn `Nest Debug`
4. Bấm play hoặc F5

Debug port: 9229

## 19 Compile và chạy project

**Type Check (khuyến nghị):**

```bash
pnpm exec tsc --noEmit
```

**Development Mode (auto-reload):**

```bash
pnpm run start:dev
```

hoặc

```bash
pnpm run start:watch
```

**Production Build:**

```bash
pnpm run build
```

**Run Production Build:**

```bash
pnpm run start:prod
```

**Nếu chạy thành công, sẽ thấy:**

```
✅ Prisma connected to PostgreSQL successfully
[NestFactory] Starting Nest application...
Nest application successfully started
API listening on http://localhost:3000
Swagger at http://localhost:3000/swagger
```

## 20 Testing

**Unit Tests:**

```bash
pnpm run test
```

**Watch Mode:**

```bash
pnpm run test:watch
```

**Coverage:**

```bash
pnpm run test:cov
```

**E2E Tests:**

```bash
pnpm run test:e2e
```

Test files:
- Jest config: `jest.config.ts`
- E2E config: `test/jest-e2e.json`

## 21 Code Formatting & Linting

**Format code with Prettier:**

```bash
pnpm run format
```

**Lint with ESLint:**

```bash
pnpm run lint
```

Config: `eslint.config.mjs`

## 22 Database Management

**View data with Prisma Studio:**

```bash
pnpm prisma studio
```

Mở `http://localhost:5555`

**Reset database (xóa tất cả dữ liệu):**

```bash
pnpm prisma migrate reset
```

**Xem trạng thái migration:**

```bash
pnpm prisma migrate status
```

**Tạo migration mới:**

```bash
pnpm prisma migrate dev --name description
```

**Deploy migrations (production):**

```bash
pnpm prisma migrate deploy
```

## 23 Flow test nên kiểm tra sau khi dựng xong

### 23.1 Test seed database

Khi start app:

- Nếu `SEED_DB=true`, app sẽ tự seed roles + users
- Kiểm tra Prisma Studio xem có roles và users không

Nếu muốn reset sạch:

```env
SEED_DB=true
CLEAR_DB=true
```

Rồi start lại app.

### 23.2 Test register OTP flow

```http
POST /api/v1/auth/register
Content-Type: application/json

{
    "email": "test@example.com",
    "userName": "testuser",
    "password": "Test@123"
}
```

- Check email nhận được OTP
- Verify OTP:

```http
POST /api/v1/auth/verify-register-otp
Content-Type: application/json

{
    "email": "test@example.com",
    "otp": "123456"
}
```

### 23.3 Test local login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "Test@123"
}
```

Response sẽ có: access_token + refresh_token (cookie)

### 23.4 Test refresh token

```http
POST /api/v1/auth/refresh
```

Sẽ lấy access token mới từ refresh token

### 23.5 Test Google login

Truy cập: `http://localhost:3000/api/v1/auth/google`

Sẽ chuyển hướng tới Google login

### 23.6 Test file upload

```http
POST /api/v1/files/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

[file binary data]
```

Sẽ return file record với Supabase URL

### 23.7 Test Swagger

Truy cập: `http://localhost:3000/swagger`

Xem tất cả endpoints, test trực tiếp

## 24 Production Deployment

**Build for production:**

```bash
pnpm run build
```

**Environment variables for production:**

```env
MODE="production"
NODE_ENV="production"
PORT=3000
# ... all other configs
```

**Run:**

```bash
pnpm run start:prod
```

**Production checklist:**

- ✅ Database: Dùng managed PostgreSQL (AWS RDS, Azure Database, etc.)
- ✅ Secrets: Sử dụng secret manager
- ✅ CORS: Cấu hình chính xác domains frontend
- ✅ HTTPS: Luôn dùng HTTPS
- ✅ Email: Cấu hình để handle production volume
- ✅ Supabase: Cấu hình bucket policies đúng
- ✅ Monitoring: Setup logs & monitoring (PM2, New Relic, etc.)
- ✅ Backups: Regular database backups
- ✅ SSL: Sử dụng valid SSL certificates

**Recommended platforms:**

- AWS (EC2, ECS, Lambda, RDS)
- Azure (App Service, Container Instances, Database)
- Google Cloud (Cloud Run, Compute Engine, Cloud SQL)
- DigitalOcean (App Platform, Droplets)
- Railway, Render, Vercel

## 25 Troubleshooting

**Issue: `DATABASE_URL is not set`**
- Solution: Kiểm tra `.env` file có `DATABASE_URL` không

**Issue: `Prisma connection failed`**
- Solution: Kiểm tra database credentials + server đang chạy

**Issue: `OTP email not received`**
- Solution: Check `EMAIL_AUTH_PASS` đúng không (phải là App Password)
- Check spam folder
- Check `EMAIL_FROM` config

**Issue: `Google login redirect fails`**
- Solution: Verify `GOOGLE_CALLBACK_URL` khớp 100% với Google Console
- Check có `/api/v1/auth/google/callback` không

**Issue: `File upload fails`**
- Solution: Verify Supabase credentials
- Check bucket exists + permissions
- Check file size

**Issue: `CORS error`**
- Solution: Thêm frontend URL vào `LIST_ORIGIN_CORS`

**Issue: `Refresh token not working`**
- Solution: Check `NUMBER_OF_DEVICES` > 0
- Check refresh token name matches `NAME_COOKIE_REFRESH_TOKEN_BROWSER`
- Check token không hết hạn

Body ví dụ:

```json
{
  "userName": "testuser",
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

Kỳ vọng:

- tạo bản ghi `PendingRegistration`
- gửi OTP vào email
- chưa tạo `User` thật ngay

### 14.3. Test verify OTP

Gọi:

```http
POST /api/v1/auth/verify-register-otp
```

Body ví dụ:

```json
{
  "email": "testuser@gmail.com",
  "otp": "123456"
}
```

Kỳ vọng:

- OTP đúng và còn hạn
- tạo user thật vào bảng `User`
- xóa bản ghi `PendingRegistration`

### 14.4. Test login

Gọi:

```http
POST /api/v1/auth/login
```

Kỳ vọng:

- trả access token
- set refresh token cookie
- tạo session trong bảng `Session`

### 14.5. Test refresh token

Gọi:

```http
POST /api/v1/auth/refresh
```

Kỳ vọng:

- session phải còn hạn trong DB
- refresh token trong cookie hợp lệ
- hệ thống cấp token mới

### 14.6. Test upload avatar/background

Endpoint upload user profile image hiện dùng:

- field file: `imgProfile`
- field loại ảnh: `typeImg`

`typeImg` hiện nhận:

- `avatar`
- `background`

## 15. Session và scheduler

Project hiện đã có job định kỳ dọn dữ liệu hết hạn:

- xóa `Session` đã quá `expiresAt`
- xóa `PendingRegistration` đã quá `otpExpiresAt`

Ngoài ra khi refresh token:

- hệ thống còn kiểm tra `expiresAt` trong bảng `Session`
- nên dù row chưa bị cron xóa thì session hết hạn vẫn không dùng được

## 16. Những file quan trọng nên nhớ

- [app.module.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/app.module.ts): nơi ghép các module
- [main.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/main.ts): bootstrap app
- [schema.prisma](D:/Downloads/codeJWT/SetupProject/Backend/prisma/schema.prisma): schema database
- [auth.service.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/auth/auth.service.ts): nghiệp vụ auth
- [session.service.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/session/session.service.ts): session theo device
- [files.service.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/files/files.service.ts): upload file / Supabase Storage
- [seed-db.service.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/seed-db/seed-db.service.ts): seed dữ liệu
- [email.service.ts](D:/Downloads/codeJWT/SetupProject/Backend/src/email/email.service.ts): gửi mail OTP

## 17. Lỗi thường gặp và cách nhớ

### 17.1. Không gửi được email

Kiểm tra:

- `EMAIL_AUTH_USER` đúng chưa
- `EMAIL_AUTH_PASS` có phải app password không
- Gmail đã bật `2-Step Verification` chưa
- mail có rơi vào `Spam` không

### 17.2. OTP verify luôn fail

Kiểm tra:

- `OTP_LENGTH`
- `OTP_EXPIRE`
- có nhập đúng email khi verify không
- OTP đã hết hạn chưa
- `attemptCount` có vượt `OTP_MAX_ATTEMPTS` chưa

### 17.3. Refresh token không hoạt động

Kiểm tra:

- cookie refresh token có được set không
- session trong DB còn hạn không
- `deviceId` có đúng không

### 17.4. Seed xong nhưng ảnh cũ vẫn còn

Hiện tại đã fix:

- nếu `CLEAR_DB=true`
- app sẽ xóa luôn file trong Supabase Storage trước khi seed lại

### 17.5. Upload file bị lỗi validation

Kiểm tra:

- có gửi file `imgProfile` chưa
- có gửi `typeImg` chưa
- `typeImg` có phải `avatar` hoặc `background` không

## 18. Trạng thái hiện tại của project

Đến thời điểm hiện tại, project đã làm xong các phần chính sau:

- auth local
- refresh token theo cookie + session DB
- login Google
- upload file lên Supabase
- seed DB
- tự dọn session hết hạn
- đăng ký bằng OTP email
- verify OTP
- giới hạn số lần nhập sai OTP
- gửi OTP bằng email template EJS

Những phần có thể làm thêm sau:

- resend OTP
- cooldown resend theo `resendAfter`
- hoàn thiện test tự động
- siết chặt route test email trước khi deploy

## 19. Lệnh hay dùng

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm exec tsc --noEmit
pnpm run start:dev
```

Nếu muốn reset sạch rồi seed lại:

1. chỉnh `.env`

```env
SEED_DB=true
CLEAR_DB=true
```

2. chạy lại app:

```bash
pnpm run start:dev
```

Sau khi seed xong, nếu không muốn lần nào start cũng xóa dữ liệu thì đổi lại:

```env
CLEAR_DB=false
```
