import { Exclude, Type } from 'class-transformer';

export class RoleEntity {
//   @Expose() //if not using excludeExtraneousValues, this is not needed, but it's good practice to be explicit about what should be included in the response
  id!: string;

//   @Expose() // if you want to include name in the response when excludeExtraneousValues is true
  name!: string;

  description?: string;

  @Type(() => Date)
  createdAt!: Date;

  @Type(() => Date)
  updatedAt!: Date;

  @Exclude() // Hide users from response to avoid circular reference and large payloads
  users?: any[]; // You can define a UserEntity type if you want to be more specific

}
