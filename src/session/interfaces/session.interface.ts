export interface ISessionEntity {
    id: string;
    userId: string;
    refreshToken: string;
    deviceId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSessionDto {
    userId: string;
    refreshToken: string;
    deviceId: string;
}


export interface ISessionController {

}

export interface ISessionService {
    upsertSession(createSessionDto: ICreateSessionDto, expiresInMs: number): Promise<ISessionEntity>;
    findSessionByRefreshTokenAndDeviceId(refreshToken: string, deviceId: string): Promise<ISessionEntity | null>;
    deleteSessionByDeviceId(userId: string, deviceId: string): Promise<boolean>;
    deleteSessionsByUserId(userId: string): Promise<boolean>;
}

