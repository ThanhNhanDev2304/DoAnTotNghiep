import { Type } from 'class-transformer';

export class SessionEntity {
  id!: string;
  userId!: string;

  refreshToken!: string;

  deviceId!: string;

  @Type(() => Date)
  expiresAt!: Date;

  @Type(() => Date)
  createdAt!: Date;

  @Type(() => Date)
  updatedAt!: Date;
}
