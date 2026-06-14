export enum FeedbackType {
  SALARY = 'SALARY',
  OVERTIME = 'OVERTIME',
  ENVIRONMENT = 'ENVIRONMENT',
  EQUIPMENT = 'EQUIPMENT',
  MANAGEMENT = 'MANAGEMENT',
  COLLEAGUE = 'COLLEAGUE',
  BENEFIT = 'BENEFIT',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER',
}

export const FeedbackTypeLabel: Record<FeedbackType, string> = {
  [FeedbackType.SALARY]: 'Lương thưởng',
  [FeedbackType.OVERTIME]: 'Tăng ca',
  [FeedbackType.ENVIRONMENT]: 'Môi trường làm việc',
  [FeedbackType.EQUIPMENT]: 'Thiết bị làm việc',
  [FeedbackType.MANAGEMENT]: 'Quản lý',
  [FeedbackType.COLLEAGUE]: 'Đồng nghiệp',
  [FeedbackType.BENEFIT]: 'Phúc lợi',
  [FeedbackType.TRAINING]: 'Đào tạo',
  [FeedbackType.OTHER]: 'Khác',
};
