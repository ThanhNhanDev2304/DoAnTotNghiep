import { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { UserEntity } from '@/users/entities/user.entity';
import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserEntity;
  },
);

export const UserGoogle = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as GoogleUser;
  },
);

// Custom decorator to extract deviceId from cookies frontend, used in login and refresh token endpoints
export const DeviceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const deviceIdEnv = process.env.NAME_DEVICEID_CLIENT!;
    if (!deviceIdEnv || deviceIdEnv.trim() === '') {
      throw new Error('Device ID cookie/header name is not defined in environment variables');
    }
    const request = ctx.switchToHttp().getRequest<Request>();
    const deviceId = request.cookies?.[deviceIdEnv];
    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
      throw new BadRequestException('Device ID not found in cookies');
    }
    return deviceId;
  },
);

