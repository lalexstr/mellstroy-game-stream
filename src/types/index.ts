import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  username: string;
  userId: string;
  avatar?: string;
  timestamp: Date;
  type: 'text' | 'donation' | 'action';
}

export interface TriggerMatch {
  keyword: string;
  videoUrl: string;
  category: string;
  priority: number;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  signal: any;
  userId: string;
  roomId: string;
}

export interface DonationData {
  amount: number;
  message?: string;
  userId: string;
  username: string;
}

