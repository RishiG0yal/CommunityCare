export type AgeGroup = 'youth' | 'adult' | 'elderly';
export type AccountType = 'individual' | 'family';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type HelpCategory = 'shopping' | 'medicine' | 'healthcare' | 'learning' | 'companionship' | 'transportation' | 'other';
export type RequestStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  passwordHash: string;
  ageGroup: AgeGroup;
  accountType: AccountType;
  isVolunteer: boolean;
  isAvailable?: boolean;
  safetyScore: number;
  points: number;
  badges: string[];
  familyId?: string;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
}

export interface HealthProfile {
  userId: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface HelpRequest {
  id: string;
  requesterId: string;
  volunteerId?: string;
  category: HelpCategory;
  description: string;
  urgencyLevel: UrgencyLevel;
  status: RequestStatus;
  isRecurring?: boolean;
  recurringSchedule?: string;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface Rating {
  id: string;
  requestId: string;
  raterId: string;
  ratedUserId: string;
  score: number;
  comment?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'help_request' | 'request_accepted' | 'request_completed' | 'rating' | 'alert' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: any;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  rank: number;
  helpCount: number;
}

export interface SafetyQuestion {
  id: string;
  question: string;
  weight: number;
}
