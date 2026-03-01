import { User } from '@/types';
import { db } from './db';

export const BADGES = {
  FIRST_HELP: { id: 'first_help', name: 'First Help', icon: '🌟', requirement: 1 },
  HELPER: { id: 'helper', name: 'Helper', icon: '🤝', requirement: 10 },
  SUPER_HELPER: { id: 'super_helper', name: 'Super Helper', icon: '⭐', requirement: 50 },
  HERO: { id: 'hero', name: 'Hero', icon: '🦸', requirement: 100 },
  TOP_10: { id: 'top_10', name: 'Top 10', icon: '🏆', requirement: 0 },
  QUICK_RESPONDER: { id: 'quick_responder', name: 'Quick Responder', icon: '⚡', requirement: 0 },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', icon: '🦉', requirement: 0 },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', icon: '🐦', requirement: 0 },
};

export const checkAndAwardBadges = (userId: string): string[] => {
  const user = db.users.findById(userId);
  if (!user || !user.isVolunteer) return [];

  const completedHelps = db.helpRequests.getAll().filter(
    r => r.volunteerId === userId && r.status === 'completed'
  );
  const helpCount = completedHelps.length;
  const newBadges: string[] = [];

  if (helpCount >= 1 && !user.badges.includes(BADGES.FIRST_HELP.id)) {
    newBadges.push(BADGES.FIRST_HELP.id);
  }
  if (helpCount >= 10 && !user.badges.includes(BADGES.HELPER.id)) {
    newBadges.push(BADGES.HELPER.id);
  }
  if (helpCount >= 50 && !user.badges.includes(BADGES.SUPER_HELPER.id)) {
    newBadges.push(BADGES.SUPER_HELPER.id);
  }
  if (helpCount >= 100 && !user.badges.includes(BADGES.HERO.id)) {
    newBadges.push(BADGES.HERO.id);
  }

  const volunteers = db.users.getAll().filter(u => u.isVolunteer).sort((a, b) => b.points - a.points);
  const rank = volunteers.findIndex(v => v.id === userId) + 1;
  if (rank <= 10 && rank > 0 && !user.badges.includes(BADGES.TOP_10.id)) {
    newBadges.push(BADGES.TOP_10.id);
  }

  if (newBadges.length > 0) {
    db.users.update(userId, { badges: [...user.badges, ...newBadges] });
  }

  return newBadges;
};

export const checkQuickResponder = (userId: string, requestCreatedAt: Date, acceptedAt: Date): boolean => {
  const user = db.users.findById(userId);
  if (!user || user.badges.includes(BADGES.QUICK_RESPONDER.id)) return false;

  const timeDiff = new Date(acceptedAt).getTime() - new Date(requestCreatedAt).getTime();
  const minutes = timeDiff / (1000 * 60);

  if (minutes <= 5) {
    db.users.update(userId, { badges: [...user.badges, BADGES.QUICK_RESPONDER.id] });
    return true;
  }
  return false;
};

export const checkTimeBasedBadges = (userId: string): string[] => {
  const user = db.users.findById(userId);
  if (!user) return [];

  const now = new Date();
  const hour = now.getHours();
  const newBadges: string[] = [];

  if (hour >= 22 || hour < 6) {
    if (!user.badges.includes(BADGES.NIGHT_OWL.id)) {
      newBadges.push(BADGES.NIGHT_OWL.id);
    }
  }

  if (hour >= 5 && hour < 7) {
    if (!user.badges.includes(BADGES.EARLY_BIRD.id)) {
      newBadges.push(BADGES.EARLY_BIRD.id);
    }
  }

  if (newBadges.length > 0) {
    db.users.update(userId, { badges: [...user.badges, ...newBadges] });
  }

  return newBadges;
};

export const getBadgeInfo = (badgeId: string) => {
  return Object.values(BADGES).find(b => b.id === badgeId);
};
