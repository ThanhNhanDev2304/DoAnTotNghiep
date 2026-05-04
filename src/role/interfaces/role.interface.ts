import { IApiResponse } from "@/common/interceptors/transform.interceptor";

export interface ICreateRoleDto {
    roleName: string;
    description?: string;
}


export interface IRoleEntity {
    id: string;
    roleName: string;
    description?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Interface Controller
export interface IRoleController {
    create(createRoleDto: ICreateRoleDto): Promise<IApiResponse<IRoleEntity>>;
    findAll(): Promise<IApiResponse<IRoleEntity[]>>;
    findOne(id: string): Promise<IApiResponse<IRoleEntity | null>>;
    update(id: string, updateRoleDto: Partial<ICreateRoleDto>): Promise<IApiResponse<IRoleEntity | null>>;
    remove(id: string): Promise<IApiResponse<IRoleEntity | null>>;
}

// Interface Service
export interface IRoleService {
    findRoleIdByName(roleNameOrId: string): Promise<string | null>;
    create(createRoleDto: ICreateRoleDto): Promise<IRoleEntity>;
    findAll(): Promise<IRoleEntity[]>;
    findOne(id: string): Promise<IRoleEntity | null>;
    update(id: string, updateRoleDto: Partial<ICreateRoleDto>): Promise<IRoleEntity | null>;
    remove(id: string): Promise<IRoleEntity | null>;
}