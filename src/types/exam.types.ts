export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type ExamType = 'mock' | 'pyq' | 'practice';
export type ExamCategory = 'upsc' | 'ssc' | 'banking' | 'railway' | 'state_psc' | 'defence' | 'teaching' | 'engineering' | 'medical' | 'law' | 'other';

export interface QuestionOption {
  text: string;
  image?: string;
}

export interface QuestionSolution {
  text: string;
  steps?: string[];
  formula?: string;
  relatedConcepts?: string[];
}

export interface SubjectPerformance {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  marks: number;
  maxMarks: number;
  accuracy: number;
  status: 'excellent' | 'good' | 'average' | 'weak';
  topics: TopicPerformance[];
}

export interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface DifficultyPerformance {
  easy: { total: number; correct: number; accuracy: number };
  medium: { total: number; correct: number; accuracy: number };
  hard: { total: number; correct: number; accuracy: number };
}

export interface WeaknessItem {
  subject: string;
  topic: string;
  accuracy: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface StartTestResponse {
  attemptId: string;
  mockTestId: string;
  questions: any[];
  duration: number;
  totalQuestions: number;
  startTime: Date;
  creditsDeducted: number;
  remainingCredits: number;
}

export interface SaveAnswerDTO {
  attemptId: string;
  questionNumber: number;
  userAnswer?: number;
  timeSpent: number;
  markedForReview?: boolean;
}

export interface SubmitTestDTO {
  attemptId: string;
  timeTaken?: number;
}