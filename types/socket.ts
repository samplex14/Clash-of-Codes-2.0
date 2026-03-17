export interface Phase1StartPayload {
  adminToken: string;
}

export interface Phase1RejoinPayload {
  usn: string;
}

export interface Phase1ConfirmAnswerPayload {
  questionId: string;
  selectedOptionId: string;
}

export interface Phase1SubmitPayload {
  questionId: string;
  selectedOptionId: string;
}

export interface Phase1AnswerAck {
  ok: boolean;
  error?: string;
  questionId?: string;
}

export interface Phase1StartAck {
  ok: boolean;
  error?: string;
  questionCount?: number;
  participantCount?: number;
}

export interface Phase1QuestionsEvent {
  questionId: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
}

export interface Phase1ResultEvent {
  score: number;
  total: number;
  breakdown: {
    questionId: string;
    correct: boolean;
  }[];
}

export interface Phase1SubmitErrorEvent {
  message: string;
  missingQuestions: string[];
}

export interface Phase1OutcomeEvent {
  usn: string;
  name: string;
  rank: number;
  score: number;
}

export interface ServerToClientEvents {
  "phase1:started": () => void;
  "phase1:ended": () => void;
  "phase1:not_started": () => void;
  "phase1:unauthorized": (payload: { message: string }) => void;
  "phase1:questions": (payload: Phase1QuestionsEvent[]) => void;
  "phase1:answer_confirmed": (payload: { questionId: string }) => void;
  "phase1:submit_error": (payload: Phase1SubmitErrorEvent) => void;
  "phase1:result": (payload: Phase1ResultEvent) => void;
  "phase1:qualified": (payload: Phase1OutcomeEvent) => void;
  "phase1:eliminated": (payload: Phase1OutcomeEvent) => void;
}

export interface ClientToServerEvents {
  "phase1:start": (payload: Phase1StartPayload, ack?: (response: Phase1StartAck) => void) => void;
  "phase1:end": (payload: Phase1StartPayload, ack?: (response: Phase1AnswerAck) => void) => void;
  "phase1:join": (payload: Phase1RejoinPayload, ack?: (response: Phase1AnswerAck & { status?: string; submitted?: boolean }) => void) => void;
  "phase1:rejoin": (payload: Phase1RejoinPayload, ack?: (response: Phase1AnswerAck & { status?: string; submitted?: boolean }) => void) => void;
  "reconnect:check": (payload: Phase1RejoinPayload, ack?: (response: Phase1AnswerAck & { status?: string; submitted?: boolean }) => void) => void;
  "phase1:confirm_answer": (payload: Phase1ConfirmAnswerPayload, ack?: (response: Phase1AnswerAck) => void) => void;
  "phase1:submit": (payload: Phase1SubmitPayload, ack?: (response: Phase1AnswerAck & { score?: number; total?: number }) => void) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  usn?: string;
}
