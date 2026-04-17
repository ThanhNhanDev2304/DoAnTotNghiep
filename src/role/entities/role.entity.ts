import { Type } from "class-transformer";

export class RoleEntity {
    id!: String;
    name!: String;
    description!: String;

    @Type(() => Date)
    createdAt!: Date;
    @Type(() => Date)
    updatedAt!: Date;

}
