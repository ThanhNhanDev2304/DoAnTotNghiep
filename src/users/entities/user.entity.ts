import { Exclude, Type } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class UserEntity {
  id!:    String;

  @IsEmail()
  email!: String;

  name!:  String;
  avatarUrl!: String | null;
  backgroundUrl!: String | null;
  description!: String | null;

  @Exclude()
  password!: String;

  @Type(() => Date)
  createdAt!: Date;
  @Type(() => Date)
  updatedAt!: Date;
}
