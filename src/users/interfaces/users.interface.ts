import { IApiResponse } from "@/common/interceptors/transform.interceptor";
import { UserImageType } from "@/users/enums/UserImageType.enum";

// Interface DTO
export interface ICreateUserDto {
    email: string;
    userName: string;
    password: string;
    roleName?: string;
}

export interface IUpdateUserDto extends Omit<ICreateUserDto, 'roleName' | 'password'> {
    description?: string | undefined;
}

export interface IUpdateUserRoleDto {
    roleNameOrId: string;
}

export interface IUpdateUserAvatarOrBGDto {
    typeImg: UserImageType;
}

// Interface Entity
export interface IUserEntity {
    id: string;
    email: string;
    userName: string;
    googleId?: string | null;
    accountType: string;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
    description?: string | null;
    roleId: string;
    roleName: string;
}

export interface IUserEntityWithPassword extends IUserEntity {
    password: string | null;
}

// Interface Controller
export interface IUsersController {
    create(createUserDto: ICreateUserDto): Promise<IApiResponse<IUserEntity>>;
    findAll(): Promise<IApiResponse<IUserEntity[]>>;
    findOne(id: string): Promise<IApiResponse<IUserEntity>>;
    update(id: string, updateUserDto: IUpdateUserDto): Promise<IApiResponse<IUserEntity>>;
    updateRole(id: string, updateUserRoleDto: IUpdateUserRoleDto): Promise<IApiResponse<IUserEntity>>;
    updateAvatarOrBG(id: string, file: Express.Multer.File, updateUserAvatarOrBGDto: IUpdateUserAvatarOrBGDto): Promise<IApiResponse<IUserEntity>>;
    remove(id: string): Promise<IApiResponse<IUserEntity>>;
}

// Interface Service
export interface IUsersService {
    checkEmailOrUsernameExists(email: string, userName: string, excludeId?: string): Promise<{ exists: boolean; field?: 'email' | 'username' | undefined }>;
    searchUserByEmailOrUsernameOrId(emailOrUserNameOrId: string): Promise<IUserEntityWithPassword | null>;
    create(createUserDto: ICreateUserDto): Promise<IUserEntity>;
    findAll(): Promise<IUserEntity[]>;
    findOne(id: string): Promise<IUserEntity>;
    update(id: string, updateUserDto: IUpdateUserDto): Promise<IUserEntity>;
    updateRole(id: string, roleNameOrId: string): Promise<IUserEntity>;
    updateAvatarOrBG(id: string, fileAvatar: Express.Multer.File, updateUserAvatarOrBGDto: IUpdateUserAvatarOrBGDto): Promise<IUserEntity>;
    remove(id: string): Promise<IUserEntity>;
}
