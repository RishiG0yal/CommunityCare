'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { LeaderboardEntry } from '@/types';

const ITEMS_PER_PAGE = 50;

export default function LeaderboardPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const users = db.users.getAll();
    const volunteers = users.filter(u => u.isVolunteer);
    
    const allLeaderboard = volunteers
      .sort((a, b) => b.points - a.points)
      .map((u, index) => ({
        userId: u.id,
        name: u.name,
        points: u.points,
        rank: index + 1,
        helpCount: db.helpRequests.getAll().filter(r => r.volunteerId === u.id && r.status === 'completed').length,
      }));

    setTotalPages(Math.ceil(allLeaderboard.length / ITEMS_PER_PAGE));
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setLeaderboard(allLeaderboard.slice(start, end));

    if (user.isVolunteer) {
      const userRank = allLeaderboard.findIndex(entry => entry.userId === user.id);
      setMyRank(userRank !== -1 ? userRank + 1 : null);
    }
  }, [user, router, page]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Leaderboard</h1>
          <Button onClick={() => router.push('/dashboard')} variant="secondary" size="sm">
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        {user.isVolunteer && myRank && (
          <Card className="mb-6 bg-primary-50 border-2 border-primary-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Your Rank</h3>
                <p className="text-3xl font-bold text-primary-600">#{myRank}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 dark:text-gray-400">Your Points</p>
                <p className="text-3xl font-bold text-primary-600">{user.points}</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Top Volunteers</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</p>
          </div>
          
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-500 text-center py-8">No volunteers yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map(entry => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded ${
                    entry.userId === user.id ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-900' :
                      entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-primary-200 text-primary-900'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {entry.name}
                        {entry.userId === user.id && <span className="text-primary-600 ml-2">(You)</span>}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.helpCount} helps completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{entry.points}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
