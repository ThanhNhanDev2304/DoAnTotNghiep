import { Exclude, Type } from 'class-transformer';

export class SessionEntity {
  id!: string;
  userId!: string;

  @Exclude() // Hide refreshToken from response
  refreshToken!: string;

  @Type(() => Date)
  expiresAt!: Date;

  @Type(() => Date)
  createdAt!: Date;

  @Type(() => Date)
  updatedAt!: Date;
}
