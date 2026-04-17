import { Exclude, Type } from 'class-transformer';

export class UserEntity {
  id!: string;
  email!: string;
  name?: string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  description?: string | null;

  @Exclude() // Hide password from response
  password!: string;

  roleId!: string;

  @Type(() => Date)
  createdAt!: Date;
  @Type(() => Date)
  updatedAt!: Date;
}
