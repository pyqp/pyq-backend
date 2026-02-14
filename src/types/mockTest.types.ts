import { DifficultyLevel } from './exam.types';

export type AttemptStatus = 'ongoing' | 'submitted' | 'reviewed';
export type TestStatus = 'active' | 'draft' | 'archived';

export interface TestResponse {
  questionNumber: number;
  userAnswer?: number;
  correctAnswer: number;
  isCorrect?: boolean;
  timeSpent: number;
  markedForReview: boolean;
  marks: number;
  subject: string;
  topic: string;
  difficulty: DifficultyLevel;
}

export interface RankInfo {
  rank: number;
  percentile: number;
  totalParticipants: number;
}

export interface AnalyticsOverview {
  finalScore: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  timeTaken: number;
  avgTimePerQuestion: number;
  rank: number;
  percentile: number;
  totalParticipants: number;
}

export interface ProgressEntry {
  attemptNumber: number;
  score: number;
  percentage: number;
  accuracy: number;
  rank: number;
  date: Date;
}

export interface FullAnalytics {
  overview: AnalyticsOverview;
  comparison: {
    vsAverage: number;
    vsTopScore: number;
    gapToTop10: number;
    averageScore: number;
    topScore: number;
    top10Cutoff: number;
  };
  subjectPerformance: any[];
  difficultyPerformance: any;
  weaknesses: any[];
  questionAnalysis: any[];
  progress: ProgressEntry[];
}