import { db } from './db';
import { calculatePoints } from './utils';

export const getWeeklyStats = (userId: string) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const requests = db.helpRequests.getAll().filter(
    r => r.volunteerId === userId && 
    r.completedAt && 
    new Date(r.completedAt) >= weekAgo
  );

  const pointsEarned = requests.reduce((sum, r) => {
    const requester = db.users.findById(r.requesterId);
    if (!requester) return sum;
    const distance = Math.sqrt(
      Math.pow(r.location.lat - requester.location.lat, 2) +
      Math.pow(r.location.lng - requester.location.lng, 2)
    ) * 111; // Rough km conversion
    return sum + calculatePoints(r.urgencyLevel, distance);
  }, 0);

  return {
    helpsCompleted: requests.length,
    pointsEarned,
    categories: requests.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};

export const getMonthlyStats = (userId: string) => {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const requests = db.helpRequests.getAll().filter(
    r => r.volunteerId === userId && 
    r.completedAt && 
    new Date(r.completedAt) >= monthAgo
  );

  return {
    helpsCompleted: requests.length,
    mostHelpedCategory: Object.entries(
      requests.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None',
  };
};
