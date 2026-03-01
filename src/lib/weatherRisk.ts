import { User, HealthProfile } from '@/types';
import { db } from './db';
import { calculateDistance, generateId } from './utils';

interface WeatherCondition {
  temp: number;
  condition: string;
}

export const checkWeatherRisk = (user: User, weather: WeatherCondition): boolean => {
  if (user.ageGroup !== 'elderly') return false;

  const healthProfile = db.healthProfiles.findByUser(user.id);
  if (!healthProfile) return false;

  const highRiskConditions = ['Diabetes', 'Heart Disease', 'Hypertension', 'Asthma', 'COPD'];
  const hasHighRiskCondition = healthProfile.conditions.some(c => highRiskConditions.includes(c));

  const extremeHeat = weather.temp > 85;
  const extremeCold = weather.temp < 40;
  const badWeather = ['Stormy', 'Heavy Rain', 'Snow', 'Extreme Heat', 'Extreme Cold'].includes(weather.condition);

  return (extremeHeat || extremeCold || badWeather) && hasHighRiskCondition;
};

export const notifyForWeatherRisk = (user: User, weather: WeatherCondition) => {
  const isAtRisk = checkWeatherRisk(user, weather);
  if (!isAtRisk) return;

  const familyMembers = user.familyId 
    ? db.users.getAll().filter(u => u.familyId === user.familyId && u.id !== user.id)
    : [];

  if (familyMembers.length > 0) {
    familyMembers.forEach(member => {
      db.notifications.create({
        id: generateId(),
        userId: member.id,
        type: 'alert',
        title: 'Weather Risk Alert',
        message: `${user.name} may be at risk due to current weather conditions. Please check on them.`,
        isRead: false,
        createdAt: new Date(),
        data: { userId: user.id, weather },
      });
    });
  } else {
    const volunteers = db.users.getAll().filter(v => v.isVolunteer);
    if (volunteers.length === 0) return;

    const nearest = volunteers
      .map(v => ({
        volunteer: v,
        distance: calculateDistance(user.location.lat, user.location.lng, v.location.lat, v.location.lng),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest) {
      db.notifications.create({
        id: generateId(),
        userId: nearest.volunteer.id,
        type: 'alert',
        title: 'Priority Weather Risk Alert',
        message: `Elderly resident ${user.name} may be at risk due to weather. No family available - please check on them.`,
        isRead: false,
        createdAt: new Date(),
        data: { userId: user.id, weather, priority: true },
      });
    }
  }
};

export const checkAllElderlyForWeatherRisk = (weather: WeatherCondition) => {
  const allUsers = db.users.getAll();
  const elderlyUsers = allUsers.filter(u => u.ageGroup === 'elderly');

  elderlyUsers.forEach(user => {
    notifyForWeatherRisk(user, weather);
  });
};
