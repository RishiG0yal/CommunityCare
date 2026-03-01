'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { generateId, findNearestVolunteers } from '@/lib/utils';
import { HELP_CATEGORIES, URGENCY_LEVELS } from '@/lib/constants';
import { HelpCategory, UrgencyLevel } from '@/types';
import { sendSMS } from '@/lib/sms';
import { sanitizeInput } from '@/lib/validation';

export default function CreateHelpRequestPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [category, setCategory] = useState<HelpCategory>('shopping');
  const [description, setDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('medium');
  const [otherCategory, setOtherCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringSchedule, setRecurringSchedule] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user) return;
      
      const sanitizedDescription = sanitizeInput(description);
      if (!sanitizedDescription.trim()) {
        setError('Please provide a description');
        return;
      }

      if (category === 'other' && !otherCategory.trim()) {
        setError('Please specify the type of help needed');
        return;
      }

      const request = {
        id: generateId(),
        requesterId: user.id,
        category: category === 'other' && otherCategory ? 'other' : category,
        description: category === 'other' && otherCategory ? `${sanitizeInput(otherCategory)}: ${sanitizedDescription}` : sanitizedDescription,
        urgencyLevel,
        status: 'pending' as const,
        isRecurring,
        recurringSchedule: isRecurring ? recurringSchedule : undefined,
        location: user.location,
        createdAt: new Date(),
      };

      db.helpRequests.create(request);

      const volunteers = db.users.getAll();
      const nearest = findNearestVolunteers(request, volunteers, 5);

      if (nearest.length > 0) {
        nearest.forEach(volunteer => {
          db.notifications.create({
            id: generateId(),
            userId: volunteer.id,
            type: 'help_request',
            title: 'New Help Request',
            message: `${user.name} needs help with ${category}`,
            isRead: false,
            createdAt: new Date(),
            data: { requestId: request.id },
          });

          if (urgencyLevel === 'critical') {
            sendSMS(volunteer.phone, `URGENT: ${user.name} needs immediate help with ${category}. Check the app now!`);
          }
        });

        if (notificationPermission === 'granted') {
          new Notification('Help Request Created', {
            body: 'Volunteers have been notified',
          });
        }
      }

      if (urgencyLevel === 'critical') {
        alert('Help request created! SMS sent to nearby volunteers.');
      } else {
        alert('Help request created!');
      }
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create request. Please try again.');
      console.error('Create request error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <h1 className="text-3xl font-bold mb-6">Request Help</h1>

          {notificationPermission === 'default' && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              <p className="mb-2">Enable notifications to get updates about your request</p>
              <Button onClick={requestNotificationPermission} size="sm" variant="secondary">
                Enable Notifications
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner text="Creating request..." />
          ) : (
            <div className="space-y-4">
              <Select
                label="What do you need help with?"
                value={category}
                onChange={(e) => setCategory(e.target.value as HelpCategory)}
                options={HELP_CATEGORIES}
                disabled={loading}
              />

              {category === 'other' && (
                <Input
                  label="Please specify"
                  value={otherCategory}
                  onChange={(e) => setOtherCategory(e.target.value)}
                  placeholder="Describe the type of help needed"
                  disabled={loading}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about what you need..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  disabled={loading}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description.length}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urgency Level
                </label>
                <div className="space-y-2">
                  {URGENCY_LEVELS.map(level => (
                    <label key={level.value} className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="urgency"
                        value={level.value}
                        checked={urgencyLevel === level.value}
                        onChange={(e) => setUrgencyLevel(e.target.value as UrgencyLevel)}
                        className="w-5 h-5"
                        disabled={loading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${level.color}`}></span>
                          <span className="font-medium">{level.label}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5"
                    disabled={loading}
                  />
                  <span className="font-medium">Make this a recurring request</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Note: Recurring requests are saved but not auto-created yet</p>
                {isRecurring && (
                  <select
                    value={recurringSchedule}
                    onChange={(e) => setRecurringSchedule(e.target.value)}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled={loading}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>

              <div className="flex space-x-4">
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  Submit Request
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="secondary" className="flex-1" disabled={loading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
