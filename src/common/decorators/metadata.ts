import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic'; // Define a metadata key to mark public routes to bypass JWT validation for the API.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); // Custom decorator to mark routes as public, allowing access without JWT authentication.