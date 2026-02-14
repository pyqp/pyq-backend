import mongoose from 'mongoose';

export const mockExamId     = new mongoose.Types.ObjectId().toString();
export const mockTestId     = new mongoose.Types.ObjectId().toString();
export const mockAttemptId  = new mongoose.Types.ObjectId().toString();
export const mockQuestionId = new mongoose.Types.ObjectId().toString();

export const mockExamData = {
  _id:          mockExamId,
  name:         'UPSC Civil Services Examination',
  shortName:    'UPSC CSE',
  slug:         'upsc-cse',
  category:     'upsc',
  conductedBy:  'UPSC',
  isActive:     true,
};

export const mockTestData = {
  _id:             mockTestId,
  name:            'UPSC CSE Mock Test 1',
  slug:            'upsc-cse-mock-1',
  exam:            mockExamId,
  duration:        120,
  totalQuestions:  2,
  totalMarks:      4,
  difficulty:      'medium',
  isPaid:          true,
  creditsRequired: 1,
  isActive:        true,
  sections: [{
    name: 'General Studies', subjects: ['History'],
    questionsCount: 2, marks: 4, duration: 120,
  }],
};

export const mockQuestionData = {
  _id:           mockQuestionId,
  exam:          mockExamId,
  questionText:  'Which is the longest river in India?',
  options:       [{ text: 'Ganga' }, { text: 'Godavari' }, { text: 'Yamuna' }, { text: 'Narmada' }],
  correctOption: 0,
  subject:       'Geography',
  topic:         'Rivers',
  difficulty:    'easy',
  marks:         2,
  negativeMarks: 0.5,
  examType:      'mock',
  isActive:      true,
};

export const mockAttemptData = {
  _id:           mockAttemptId,
  user:          new mongoose.Types.ObjectId().toString(),
  mockTest:      mockTestId,
  attemptNumber: 1,
  status:        'ongoing',
  startTime:     new Date(),
  responses:     [],
};