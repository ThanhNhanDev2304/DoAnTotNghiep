export interface IDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  managerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentService {
  create(dto: { name: string; code: string; description?: string; managerId?: string }): Promise<IDepartment>;
  findAll(): Promise<IDepartment[]>;
  findOne(id: string): Promise<IDepartment>;
  update(id: string, dto: Partial<{ name: string; code: string; description: string; managerId: string }>): Promise<IDepartment>;
  remove(id: string): Promise<IDepartment>;
}
