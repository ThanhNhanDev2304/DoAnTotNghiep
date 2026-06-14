export interface IAiSentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;       // 0.0 - 1.0
  reasoning: string;
  keywords: string[];  // từ khóa nổi bật trích xuất
}

export interface IAiSentimentService {
  analyzeSentiment(text: string): Promise<IAiSentimentResult>;
  generateMonthlyReport(data: IMonthlyReportData): Promise<string>;
}

export interface IMonthlyReportData {
  month: number;
  year: number;
  totalFeedbacks: number;
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  topIssues: string[];
  departmentScores: Array<{ name: string; score: number }>;
}
