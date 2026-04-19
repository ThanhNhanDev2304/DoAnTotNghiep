import { IS_PUBLIC_KEY } from '@/lib/decorator/metadata';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check if the route is marked as public using the custom @Public() decorator
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        // If the route is public, allow access without authentication
        if (isPublic) {
            return true;
        }
        return super.canActivate(context); // Otherwise, use the default JWT authentication logic
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired token');
        } else if (info) {
            throw new UnauthorizedException(info.message);
        }
        return user;
    }
}