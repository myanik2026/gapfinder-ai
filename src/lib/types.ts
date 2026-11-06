export interface StudySource {
  id: string;
  name: string;
  text: string;
}

export interface Citation {
  source: string;
  excerpt: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  citation: Citation;
}

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
  score: number;
}

export interface QuizAttempt {
  id: string;
  createdAt: string;
  topic: string;
  correct: number;
  total: number;
  topicResults: TopicResult[];
}

export interface StudyReply {
  answer: string;
  citation: Citation;
}
