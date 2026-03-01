import { User, HelpRequest, Rating, Notification, HealthProfile, Message } from '@/types';

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveToStorage = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

const getUsers = () => loadFromStorage<User[]>('users', []);
const getHelpRequests = () => loadFromStorage<HelpRequest[]>('helpRequests', []);
const getRatings = () => loadFromStorage<Rating[]>('ratings', []);
const getNotifications = () => loadFromStorage<Notification[]>('notifications', []);
const getHealthProfiles = () => loadFromStorage<HealthProfile[]>('healthProfiles', []);
const getMessages = () => loadFromStorage<Message[]>('messages', []);

export const clientDb = {
  users: {
    create: (user: User) => {
      const users = getUsers();
      users.push(user);
      saveToStorage('users', users);
      return user;
    },
    findByEmail: (email: string) => getUsers().find(u => u.email === email),
    findById: (id: string) => getUsers().find(u => u.id === id),
    update: (id: string, data: Partial<User>) => {
      const users = getUsers();
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveToStorage('users', users);
        return users[index];
      }
      return null;
    },
    getAll: () => getUsers(),
  },
  
  helpRequests: {
    create: (request: HelpRequest) => {
      const helpRequests = getHelpRequests();
      helpRequests.push(request);
      saveToStorage('helpRequests', helpRequests);
      return request;
    },
    findById: (id: string) => getHelpRequests().find(r => r.id === id),
    findByStatus: (status: string) => getHelpRequests().filter(r => r.status === status),
    findByRequester: (requesterId: string) => getHelpRequests().filter(r => r.requesterId === requesterId),
    findByVolunteer: (volunteerId: string) => getHelpRequests().filter(r => r.volunteerId === volunteerId),
    update: (id: string, data: Partial<HelpRequest>) => {
      const helpRequests = getHelpRequests();
      const index = helpRequests.findIndex(r => r.id === id);
      if (index !== -1) {
        helpRequests[index] = { ...helpRequests[index], ...data };
        saveToStorage('helpRequests', helpRequests);
        return helpRequests[index];
      }
      return null;
    },
    getAll: () => getHelpRequests(),
  },
  
  ratings: {
    create: (rating: Rating) => {
      const ratings = getRatings();
      ratings.push(rating);
      saveToStorage('ratings', ratings);
      return rating;
    },
    findByUser: (userId: string) => getRatings().filter(r => r.ratedUserId === userId),
    getAll: () => getRatings(),
  },
  
  notifications: {
    create: (notification: Notification) => {
      const notifications = getNotifications();
      notifications.push(notification);
      saveToStorage('notifications', notifications);
      return notification;
    },
    findByUser: (userId: string) => getNotifications().filter(n => n.userId === userId),
    markAsRead: (id: string) => {
      const notifications = getNotifications();
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        notification.isRead = true;
        saveToStorage('notifications', notifications);
      }
      return notification;
    },
  },
  
  healthProfiles: {
    create: (profile: HealthProfile) => {
      const healthProfiles = getHealthProfiles();
      healthProfiles.push(profile);
      saveToStorage('healthProfiles', healthProfiles);
      return profile;
    },
    findByUser: (userId: string) => getHealthProfiles().find(p => p.userId === userId),
    update: (userId: string, data: Partial<HealthProfile>) => {
      const healthProfiles = getHealthProfiles();
      const index = healthProfiles.findIndex(p => p.userId === userId);
      if (index !== -1) {
        healthProfiles[index] = { ...healthProfiles[index], ...data };
        saveToStorage('healthProfiles', healthProfiles);
        return healthProfiles[index];
      }
      return null;
    },
  },

  messages: {
    create: (message: Message) => {
      const messages = getMessages();
      messages.push(message);
      saveToStorage('messages', messages);
      return message;
    },
    findByRequest: (requestId: string) => getMessages().filter(m => m.requestId === requestId),
    findByUser: (userId: string) => getMessages().filter(m => m.senderId === userId || m.receiverId === userId),
    markAsRead: (id: string) => {
      const messages = getMessages();
      const message = messages.find(m => m.id === id);
      if (message) {
        message.isRead = true;
        saveToStorage('messages', messages);
      }
      return message;
    },
  },
};
