export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  imageTitle: string;
  imageUrl: string;
}

export interface Player {
  name: string;
  score: number;
  currentAnswer: number | null;
}

export interface GameState {
  status: 'lobby' | 'question' | 'results' | 'image' | 'podium';
  currentQuestionIndex: number;
  players: Record<string, Player>;
  timeRemaining: number;
  questionStartTime: number;
  question: Question;
}
