import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic'; // Define a metadata key to mark public routes to bypass JWT validation for the API.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); // Custom decorator to mark routes as public, allowing access without JWT authentication.

export const IS_ADMIN_ONLY_KEY = 'isAdminOnly';
export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY_KEY, true); // in file jwt-auth.guard.ts, we will check if the route is marked as admin-only, if it is, we will check if the user has the admin role before allowing access to the route.