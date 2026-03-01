import { User, HelpRequest, UrgencyLevel } from '@/types';

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findNearestVolunteers = (request: HelpRequest, volunteers: User[], limit: number = 5): User[] => {
  return volunteers
    .filter(v => v.isVolunteer)
    .map(v => ({
      volunteer: v,
      distance: calculateDistance(
        request.location.lat,
        request.location.lng,
        v.location.lat,
        v.location.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(v => v.volunteer);
};

export const calculatePoints = (urgency: UrgencyLevel, distance: number): number => {
  const urgencyPoints = {
    low: 10,
    medium: 20,
    high: 40,
    critical: 100,
  };
  
  const distancePoints = Math.max(0, 50 - Math.floor(distance * 2));
  return urgencyPoints[urgency] + distancePoints;
};

export const calculateSafetyScore = (answers: boolean[]): number => {
  const positiveAnswers = answers.filter(a => a).length;
  return Math.round((positiveAnswers / answers.length) * 100);
};

export const updateSafetyScoreFromRatings = (currentScore: number, newRating: number): number => {
  return Math.round((currentScore * 0.8) + (newRating * 4));
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

export const estimateTime = (distance: number): string => {
  const minutes = Math.round((distance / 30) * 60);
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
