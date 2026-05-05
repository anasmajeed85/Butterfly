export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'butterfly';
  timestamp: number;
}

export interface UserSession {
  id: string;
  hasCapturedPhoto: boolean;
  photoUrl?: string;
  createdAt: number;
}
