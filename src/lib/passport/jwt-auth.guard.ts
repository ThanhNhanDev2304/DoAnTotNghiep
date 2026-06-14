import { IS_ADMIN_ONLY_KEY, IS_PUBLIC_KEY, ROLES_KEY } from '@/common/decorators/metadata';
import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private readonly configService: ConfigService
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

    // Override the default handleRequest method to include additional checks for admin-only routes
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired token');
        } else if (info) {
            throw new UnauthorizedException(info.message);
        }

        // Check if the route is marked as admin-only using the custom @AdminOnly() decorator
        const isAdminOnly = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_ONLY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isAdminOnly) {
            const adminRoleName = this.configService.get<string>('NAME_ROLE_ADMIN');
            if (adminRoleName === undefined) {
                throw new Error('Admin role name is not defined in environment variables');
            }
            if (user.roleName !== adminRoleName) {
                throw new ForbiddenException('Access denied: Administrators only.');
            }
        }

        // Check @Roles() decorator — user must have one of the allowed roles
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requiredRoles && requiredRoles.length > 0) {
            if (!requiredRoles.includes(user.roleName)) {
                throw new ForbiddenException(`Access denied: required role(s): ${requiredRoles.join(', ')}`);
            }
        }

        return user;
    }
}