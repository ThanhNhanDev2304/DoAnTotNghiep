export const roles = [
  { roleName: process.env.NAME_ROLE_ADMIN! || 'ADMIN', description: 'Quản trị viên hệ thống' },
  { roleName: process.env.NAME_ROLE_HR! || 'HR', description: 'Nhân sự — quản lý phản hồi, khảo sát, thông báo' },
  { roleName: process.env.NAME_ROLE_USER! || 'EMPLOYEE', description: 'Người lao động' },
];

export const departments = [
  { name: 'HR', code: 'HR01', description: 'Phòng Nhân sự' },
  { name: 'QA', code: 'QA01', description: 'Phòng Kiểm soát chất lượng' },
  { name: 'SMT', code: 'SMT01', description: 'Dây chuyền SMT (Surface Mount Technology)' },
  { name: 'PE', code: 'PE01', description: 'Phòng Kỹ thuật sản xuất' },
  { name: 'Warehouse', code: 'WH01', description: 'Kho hàng' },
  { name: 'Production', code: 'PRD01', description: 'Sản xuất chính' },
];

export const positions = [
  { name: 'Công nhân', description: 'Công nhân sản xuất trực tiếp' },
  { name: 'Tổ trưởng', description: 'Tổ trưởng dây chuyền' },
  { name: 'Quản đốc', description: 'Quản đốc phân xưởng' },
  { name: 'Trưởng phòng', description: 'Trưởng phòng ban' },
  { name: 'Nhân viên HR', description: 'Nhân viên phòng nhân sự' },
  { name: 'Kỹ sư', description: 'Kỹ sư kỹ thuật' },
];

export const shifts = [
  { name: 'Ca sáng', startTime: '06:00', endTime: '18:00', description: 'Ca sáng (6:00 - 18:00)' },
  { name: 'Ca tối', startTime: '18:00', endTime: '06:00', description: 'Ca tối (18:00 - 6:00)' },
];

export const users = [
  { email: 'admin@umc.com', userName: 'Admin', fullName: 'Quản trị viên', employeeCode: '00001', password: process.env.DEFAULT_PASSWORD || '123456' },
  { email: 'hr@umc.com', userName: 'HR', fullName: 'Nguyễn Thị Nhân Sự', employeeCode: '00002', password: process.env.DEFAULT_PASSWORD || '123456' },
  { email: 'nv001@umc.com', userName: 'NV001', fullName: 'Trần Văn An', employeeCode: '00003', password: process.env.DEFAULT_PASSWORD || '123456' },
  { email: 'nv002@umc.com', userName: 'NV002', fullName: 'Lê Thị Bình', employeeCode: '00004', password: process.env.DEFAULT_PASSWORD || '123456' },
];
