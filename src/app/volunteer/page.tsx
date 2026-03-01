'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { HelpRequest, Notification } from '@/types';
import { calculateDistance, calculatePoints, generateId, formatTimeAgo, estimateTime } from '@/lib/utils';
import { checkAndAwardBadges, checkQuickResponder, checkTimeBasedBadges } from '@/lib/badges';

export default function VolunteerPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [weatherAlerts, setWeatherAlerts] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.isVolunteer) {
      router.push('/dashboard');
      return;
    }
    if (user.safetyScore < 50) {
      alert('Your safety score must be at least 50 to volunteer. Please complete the safety questionnaire or contact support.');
      router.push('/dashboard');
      return;
    }

    loadRequests();
    loadWeatherAlerts();
  }, [user, router, filter]);

  const loadWeatherAlerts = () => {
    if (!user) return;
    const alerts = db.notifications.findByUser(user.id).filter(n => n.type === 'alert' && !n.isRead);
    setWeatherAlerts(alerts);
  };

  const loadRequests = () => {
    if (!user) return;
    
    let allRequests = db.helpRequests.findByStatus('pending');
    
    if (filter !== 'all') {
      allRequests = allRequests.filter(r => r.urgencyLevel === filter);
    }

    allRequests.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    });

    setRequests(allRequests);
  };

  const handleAccept = (request: HelpRequest) => {
    if (!user) return;

    const distance = calculateDistance(
      user.location.lat,
      user.location.lng,
      request.location.lat,
      request.location.lng
    );

    const points = calculatePoints(request.urgencyLevel, distance);
    const acceptedAt = new Date();

    db.helpRequests.update(request.id, {
      volunteerId: user.id,
      status: 'assigned',
      acceptedAt,
      earnedPoints: points,
    });

    const quickResponder = checkQuickResponder(user.id, request.createdAt, acceptedAt);

    db.notifications.create({
      id: generateId(),
      userId: request.requesterId,
      type: 'request_accepted',
      title: 'Help is on the way!',
      message: `${user.name} has accepted your request`,
      isRead: false,
      createdAt: new Date(),
      data: { requestId: request.id },
    });

    if (quickResponder) {
      alert(`Request accepted! You will earn ${points} points after completion.`);
    } else {
      alert(`Request accepted! You will earn ${points} points after completion.`);
    }
    loadRequests();
  };

  const handleComplete = (request: HelpRequest) => {
    if (!user) return;

    const points = (request as any).earnedPoints || 0;

    db.helpRequests.update(request.id, {
      status: 'completed',
      completedAt: new Date(),
    });

    const updatedUser = db.users.update(user.id, {
      points: user.points + points,
    });

    if (updatedUser) {
      setUser(updatedUser);
    }

    db.notifications.create({
      id: generateId(),
      userId: request.requesterId,
      type: 'request_completed',
      title: 'Help Completed',
      message: 'Please rate your experience',
      isRead: false,
      createdAt: new Date(),
      data: { requestId: request.id },
    });

    const milestones = checkAndAwardBadges(user.id);
    const timeBased = checkTimeBasedBadges(user.id);
    const allNewBadges = [...milestones, ...timeBased];
    
    if (allNewBadges.length > 0) {
      alert(`Request completed! You earned new badges: ${allNewBadges.join(', ')}`);
    } else {
      alert('Request marked as completed!');
    }
    
    router.push('/dashboard');
  };

  const handleUpdateStatus = (requestId: string, status: string) => {
    db.helpRequests.update(requestId, { status: status as any });
    const request = db.helpRequests.findById(requestId);
    if (request) {
      db.notifications.create({
        id: generateId(),
        userId: request.requesterId,
        type: 'alert',
        title: 'Status Update',
        message: `Your request status: ${status}`,
        isRead: false,
        createdAt: new Date(),
        data: { requestId },
      });
    }
    loadRequests();
  };

  if (!user || !user.isVolunteer) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Volunteer Dashboard</h1>
          <Button onClick={() => router.push('/dashboard')} variant="secondary" size="sm">
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        {weatherAlerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {weatherAlerts.map(alert => (
              <div key={alert.id} className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-red-800 flex items-center">
                      <span className="mr-2">⚠️</span>
                      {alert.title}
                      {alert.data?.priority && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">PRIORITY</span>}
                    </h3>
                    <p className="text-red-700 mt-1">{alert.message}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      db.notifications.markAsRead(alert.id);
                      loadWeatherAlerts();
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Filter by Urgency</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map(f => (
              <Button
                key={f}
                onClick={() => setFilter(f as any)}
                variant={filter === f ? 'primary' : 'secondary'}
                size="sm"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Available Help Requests</h2>
        
        {requests.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-500 text-center py-8">No requests available at the moment</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map(request => {
              const requester = db.users.findById(request.requesterId);
              const distance = calculateDistance(
                user.location.lat,
                user.location.lng,
                request.location.lat,
                request.location.lng
              );
              const points = calculatePoints(request.urgencyLevel, distance);
              const eta = estimateTime(distance);

              return (
                <Card key={request.id}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{request.category}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested by {requester?.name} • {distance.toFixed(1)} km away • {eta}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatTimeAgo(request.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      request.urgencyLevel === 'critical' ? 'bg-red-500 text-white' :
                      request.urgencyLevel === 'high' ? 'bg-orange-500 text-white' :
                      request.urgencyLevel === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {request.urgencyLevel}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{request.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-primary-600 font-semibold">
                      Earn {points} points
                    </span>
                    <Button onClick={() => handleAccept(request)}>
                      Accept Request
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">My Assigned Requests</h2>
          {db.helpRequests.findByVolunteer(user.id).filter(r => r.status !== 'completed').map(request => {
            const requester = db.users.findById(request.requesterId);
            return (
              <Card key={request.id} className="mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{request.category}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Requested by {requester?.name}</p>
                  </div>
                  <span className="px-3 py-1 rounded text-sm bg-blue-500 text-white">
                    {request.status}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{request.description}</p>
                <div className="flex space-x-2">
                  {request.status === 'assigned' && (
                    <Button onClick={() => handleUpdateStatus(request.id, 'in-progress')} variant="secondary">
                      Start Help
                    </Button>
                  )}
                  <Button onClick={() => router.push(`/chat/${request.id}`)} variant="secondary">
                    Chat
                  </Button>
                  <Button onClick={() => handleComplete(request)}>
                    Mark as Completed
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
