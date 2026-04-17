import { Exclude, Type } from "class-transformer";

export class SessionEntity {
    id!: String;
    userId!: String;
    @Exclude() // do not include refreshToken in the response when transforming to JSON
    refreshToken!: String;
    @Type(() => Date)
    expiresAt!: Date;
    @Type(() => Date)
    createdAt!: Date;
    @Type(() => Date)
    updatedAt!: Date;

}
