'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { useThemeStore } from '@/store/themeStore';
import { db } from '@/lib/db';
import { HelpRequest, LeaderboardEntry } from '@/types';
import { checkAllElderlyForWeatherRisk } from '@/lib/weatherRisk';
import { generateId, formatTimeAgo } from '@/lib/utils';
import { getWeeklyStats, getMonthlyStats } from '@/lib/stats';

export default function DashboardPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const { isDark, toggleTheme } = useThemeStore();
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = useState<HelpRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<HelpRequest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weather, setWeather] = useState({ temp: 72, condition: 'Sunny' });
  const [weatherChecked, setWeatherChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const requests = db.helpRequests.findByRequester(user.id);
    setMyRequests(requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled'));
    setCompletedRequests(requests.filter(r => r.status === 'completed' || r.status === 'cancelled'));

    if (user.isVolunteer) {
      const assigned = db.helpRequests.findByVolunteer(user.id);
      setAssignedRequests(assigned);
    }

    const users = db.users.getAll();
    const leaderboardData = users
      .filter(u => u.isVolunteer)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u, index) => ({
        userId: u.id,
        name: u.name,
        points: u.points,
        rank: index + 1,
        helpCount: db.helpRequests.getAll().filter(r => r.volunteerId === u.id && r.status === 'completed').length,
      }));
    setLeaderboard(leaderboardData);
  }, [user, router]);

  useEffect(() => {
    if (!weatherChecked) {
      checkAllElderlyForWeatherRisk(weather);
      setWeatherChecked(true);
    }
  }, [weather, weatherChecked]);

  if (!user) return null;

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/');
    }
  };

  const weatherScenarios = [
    { temp: 72, condition: 'Sunny', label: 'Normal' },
    { temp: 95, condition: 'Extreme Heat', label: 'Extreme Heat' },
    { temp: 30, condition: 'Extreme Cold', label: 'Extreme Cold' },
    { temp: 65, condition: 'Stormy', label: 'Storm' },
  ];

  const handleWeatherChange = (scenario: typeof weatherScenarios[0]) => {
    setWeather(scenario);
    setWeatherChecked(false);
    checkAllElderlyForWeatherRisk(scenario);
    alert(`Weather changed to: ${scenario.label} (${scenario.temp}°F)`);
  };

  const handleReportNoShow = (requestId: string, volunteerId: string) => {
    if (!confirm('Are you sure the volunteer did not show up?')) return;

    const volunteer = db.users.findById(volunteerId);
    if (volunteer) {
      db.users.update(volunteerId, { points: Math.max(0, volunteer.points - 20) });
    }

    db.helpRequests.update(requestId, {
      status: 'pending',
      volunteerId: undefined,
      acceptedAt: undefined,
    });

    db.notifications.create({
      id: generateId(),
      userId: volunteerId,
      type: 'alert',
      title: 'No-Show Penalty',
      message: 'You have been reported for not showing up. 20 points deducted.',
      isRead: false,
      createdAt: new Date(),
      data: { requestId },
    });

    alert('Request reopened and volunteer penalized (-20 points)');
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleCancelRequest = (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    const request = db.helpRequests.findById(requestId);
    if (!request) return;

    db.helpRequests.update(requestId, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });

    if (request.volunteerId) {
      db.notifications.create({
        id: generateId(),
        userId: request.volunteerId,
        type: 'alert',
        title: 'Request Cancelled',
        message: 'The help request you accepted has been cancelled.',
        isRead: false,
        createdAt: new Date(),
        data: { requestId },
      });
    }

    alert('Request cancelled');
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Community Care</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Welcome, {user.name}</span>
            <Button onClick={toggleTheme} variant="secondary" size="sm">
              {isDark ? '☀️' : '🌙'}
            </Button>
            <Button onClick={() => router.push('/profile')} variant="secondary" size="sm">
              Profile
            </Button>
            <Button onClick={handleLogout} variant="danger" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {user.safetyScore === 0 && (
          (() => {
            const userRatings = db.ratings.findByUser(user.id);
            const hasRatings = userRatings.length > 0;
            
            return hasRatings ? (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-red-800">Safety Score Alert</h3>
                    <p className="text-red-700">Your safety score has dropped to 0. Please contact our support team for assistance.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800">Complete Your Safety Assessment</h3>
                    <p className="text-yellow-700">You haven't completed the safety questionnaire yet. Complete it to get your safety score and unlock volunteering.</p>
                  </div>
                  <Button onClick={() => router.push('/questionnaire')}>
                    Complete Now
                  </Button>
                </div>
              </div>
            );
          })()
        )}

        <div className={`grid grid-cols-1 gap-4 ${user.isVolunteer ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Safety Score</h3>
            <p className="text-4xl font-bold text-primary-600">{user.safetyScore}</p>
          </Card>
          {user.isVolunteer && (
            <Card>
              <h3 className="text-lg font-semibold mb-2">Your Points</h3>
              <p className="text-4xl font-bold text-primary-600">{user.points}</p>
            </Card>
          )}
          <Card>
            <h3 className="text-lg font-semibold mb-2">Weather</h3>
            <p className="text-2xl">{weather.temp}°F</p>
            <p className="text-gray-600 dark:text-gray-400">{weather.condition}</p>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-500">Test Weather Scenarios:</p>
              <div className="flex flex-wrap gap-2">
                {weatherScenarios.map(scenario => (
                  <Button
                    key={scenario.label}
                    onClick={() => handleWeatherChange(scenario)}
                    size="sm"
                    variant={weather.temp === scenario.temp ? 'primary' : 'secondary'}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {user.isVolunteer && (() => {
          const weeklyStats = getWeeklyStats(user.id);
          const monthlyStats = getMonthlyStats(user.id);
          return (
            <Card>
              <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-2xl font-bold text-blue-600">{weeklyStats.helpsCompleted} helps</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-green-600">{monthlyStats.helpsCompleted} helps</p>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Top Category</p>
                  <p className="text-lg font-bold text-purple-600">{monthlyStats.mostHelpedCategory}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
                  <p className="text-2xl font-bold text-yellow-600">{user.badges.length}</p>
                </div>
              </div>
            </Card>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Help Requests</h2>
              <Button onClick={() => router.push('/help-request/create')} size="sm">
                New Request
              </Button>
            </div>
            {myRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-500">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {myRequests.map(request => {
                  const volunteer = request.volunteerId ? db.users.findById(request.volunteerId) : null;
                  return (
                    <div key={request.id} className="border p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold">{request.category}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{formatTimeAgo(request.createdAt)}</span>
                          {request.isRecurring && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Recurring</span>}
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                      {volunteer && (request.status === 'assigned' || request.status === 'in-progress') && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {request.status === 'assigned' ? 'Assigned to:' : 'Being helped by:'} {volunteer.name}
                          </span>
                          <div className="space-x-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => router.push(`/chat/${request.id}`)}
                            >
                              Chat
                            </Button>
                            {request.status === 'assigned' && (
                              <Button 
                                size="sm" 
                                variant="danger"
                                onClick={() => handleReportNoShow(request.id, volunteer.id)}
                              >
                                Report No-Show
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      {request.status === 'pending' && (
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleCancelRequest(request.id)}
                          >
                            Cancel Request
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {user.isVolunteer && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Assigned to Me</h2>
                <Button onClick={() => router.push('/volunteer')} size="sm">
                  Browse Requests
                </Button>
              </div>
              {assignedRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-500">No assigned requests</p>
              ) : (
                <div className="space-y-3">
                  {assignedRequests.map(request => (
                    <div key={request.id} className="border p-3 rounded">
                      <div className="flex justify-between">
                        <span className="font-semibold">{request.category}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          request.urgencyLevel === 'critical' ? 'bg-red-500 text-white' :
                          request.urgencyLevel === 'high' ? 'bg-orange-500 text-white' :
                          request.urgencyLevel === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {request.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {completedRequests.length > 0 && (
          <Card>
            <h2 className="text-2xl font-bold mb-4">Request History</h2>
            <div className="space-y-3">
              {completedRequests.map(request => {
                const volunteer = request.volunteerId ? db.users.findById(request.volunteerId) : null;
                const existingRating = db.ratings.getAll().find(r => r.requestId === request.id && r.raterId === user.id);
                return (
                  <div key={request.id} className="border p-3 rounded bg-gray-50">
                    <div className="flex justify-between">
                      <span className="font-semibold">{request.category}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                    {volunteer && (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-500">Helped by: {volunteer.name}</p>
                        {request.status === 'completed' && !existingRating && (
                          <div className="space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => {
                                const rating = prompt('Rate your experience (1-5 stars):');
                                if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
                                  const comment = prompt('Add a comment (optional):') || '';
                                  const ratingScore = Number(rating);
                                  
                                  db.ratings.create({
                                    id: generateId(),
                                    requestId: request.id,
                                    raterId: user.id,
                                    ratedUserId: volunteer.id,
                                    score: ratingScore,
                                    comment,
                                    createdAt: new Date(),
                                  });
                                  
                                  const allRatings = db.ratings.findByUser(volunteer.id);
                                  const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
                                  const newSafetyScore = Math.min(100, Math.round(avgRating * 20));
                                  
                                  db.users.update(volunteer.id, {
                                    safetyScore: newSafetyScore,
                                  });
                                  
                                  alert('Thank you for your rating!');
                                  window.location.reload();
                                }
                              }}
                            >
                              Rate Volunteer
                            </Button>
                            <Button 
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                if (!confirm('Report fake completion? This will penalize the volunteer.')) return;
                                
                                const points = (request as any).earnedPoints || 0;
                                const currentPoints = volunteer.points;
                                const penalty = points + 50;
                                
                                const updatedBadges = volunteer.badges.includes('🚫 Fake Helper') 
                                  ? volunteer.badges 
                                  : [...volunteer.badges, '🚫 Fake Helper'];
                                
                                db.users.update(volunteer.id, {
                                  points: Math.max(0, currentPoints - penalty),
                                  safetyScore: Math.max(0, volunteer.safetyScore - 20),
                                  badges: updatedBadges,
                                });
                                
                                db.helpRequests.update(request.id, {
                                  status: 'pending',
                                  volunteerId: undefined,
                                  acceptedAt: undefined,
                                  completedAt: undefined,
                                });
                                
                                db.notifications.create({
                                  id: generateId(),
                                  userId: volunteer.id,
                                  type: 'alert',
                                  title: 'Fake Completion Report',
                                  message: `You have been reported for fake completion. -${penalty} points, -20 safety score.`,
                                  isRead: false,
                                  createdAt: new Date(),
                                  data: { requestId: request.id },
                                });
                                
                                alert('Volunteer penalized. Request reopened.');
                                window.location.reload();
                              }}
                            >
                              Report Fake
                            </Button>
                          </div>
                        )}
                        {existingRating && (
                          <span className="text-xs text-green-600">★ Rated {existingRating.score}/5</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-2xl font-bold mb-4">Top Volunteers</h2>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-500">No volunteers yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map(entry => (
                <div key={entry.userId} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-primary-600">#{entry.rank}</span>
                    <div>
                      <p className="font-semibold">{entry.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.helpCount} helps completed</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-primary-600">{entry.points} pts</span>
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => router.push('/leaderboard')} variant="secondary" className="w-full mt-4">
            View Full Leaderboard
          </Button>
        </Card>
      </div>
    </div>
  );
}
