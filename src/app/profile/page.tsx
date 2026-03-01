'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { AgeGroup, AccountType } from '@/types';
import { HEALTH_CONDITIONS } from '@/lib/constants';
import { getBadgeInfo } from '@/lib/badges';

export default function ProfilePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [conditions, setConditions] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    setName(user.name);
    setPhone(user.phone);
    setAgeGroup(user.ageGroup);
    setAccountType(user.accountType);
    setIsVolunteer(user.isVolunteer);

    const profile = db.healthProfiles.findByUser(user.id);
    if (profile) {
      setHealthProfile(profile);
      setConditions(profile.conditions);
    }
  }, [user, router]);

  const handleSave = () => {
    if (!user) return;

    if (isVolunteer && user.safetyScore < 50) {
      const userRatings = db.ratings.findByUser(user.id);
      const message = userRatings.length > 0
        ? 'Your safety score must be at least 50 to volunteer. Please contact our support team to get yourself cleared.'
        : 'Your safety score must be at least 50 to volunteer. Please complete the safety questionnaire first.';
      alert(message);
      return;
    }

    const updatedUser = db.users.update(user.id, {
      name,
      phone,
      ageGroup,
      accountType,
      isVolunteer,
    });

    if (updatedUser) {
      setUser(updatedUser);
    }

    if (healthProfile) {
      db.healthProfiles.update(user.id, { conditions });
    }

    setEditing(false);
    alert('Profile updated!');
  };

  const handleConditionToggle = (condition: string) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">My Profile</h1>
          <Button onClick={() => router.push('/dashboard')} variant="secondary" size="sm">
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Personal Information</h2>
            {!editing ? (
              <Button onClick={() => setEditing(true)} size="sm">
                Edit Profile
              </Button>
            ) : (
              <div className="space-x-2">
                <Button onClick={handleSave} size="sm">
                  Save
                </Button>
                <Button onClick={() => setEditing(false)} variant="secondary" size="sm">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editing}
            />
            <Input
              label="Email"
              value={user.email}
              disabled
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!editing}
            />
            <Select
              label="Age Group"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              options={[
                { value: 'youth', label: 'Youth (Under 25)' },
                { value: 'adult', label: 'Adult (25-60)' },
                { value: 'elderly', label: 'Elderly (60+)' },
              ]}
              disabled={!editing}
            />
            <Select
              label="Account Type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'family', label: 'Family' },
              ]}
              disabled={!editing}
            />
            {user.familyId && (
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Family Code</p>
                <p className="text-lg font-mono font-bold text-blue-600">{user.familyId}</p>
                <p className="text-xs text-gray-500 mt-1">Share this code with family members</p>
              </div>
            )}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isVolunteer}
                onChange={(e) => setIsVolunteer(e.target.checked)}
                disabled={!editing}
                className="w-5 h-5"
              />
              <span>I want to volunteer</span>
            </label>
            {user.isVolunteer && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={user.isAvailable}
                  onChange={(e) => db.users.update(user.id, { isAvailable: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="flex items-center">
                  Available Now 
                  <span className={`ml-2 w-3 h-3 rounded-full ${user.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
              </label>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-50 p-4 rounded">
              <p className="text-gray-600 dark:text-gray-400">Safety Score</p>
              <p className="text-3xl font-bold text-primary-600">{user.safetyScore}</p>
            </div>
            <div className="bg-primary-50 p-4 rounded">
              <p className="text-gray-600 dark:text-gray-400">Points</p>
              <p className="text-3xl font-bold text-primary-600">{user.points}</p>
            </div>
          </div>
        </Card>

        {user.isVolunteer && user.badges.length > 0 && (
          <Card>
            <h2 className="text-2xl font-bold mb-4">Badges</h2>
            <div className="flex flex-wrap gap-3">
              {user.badges.map(badgeId => {
                const badge = getBadgeInfo(badgeId);
                return badge ? (
                  <div key={badgeId} className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 text-center">
                    <div className="text-3xl">{badge.icon}</div>
                    <div className="text-sm font-semibold mt-1">{badge.name}</div>
                  </div>
                ) : null;
              })}
            </div>
          </Card>
        )}

        {healthProfile && (
          <Card>
            <h2 className="text-2xl font-bold mb-4">Health Profile</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Health Conditions</h3>
                {editing ? (
                  <div className="grid grid-cols-2 gap-2">
                    {HEALTH_CONDITIONS.map(condition => (
                      <label key={condition} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={conditions.includes(condition)}
                          onChange={() => handleConditionToggle(condition)}
                          className="w-5 h-5"
                        />
                        <span>{condition}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {healthProfile.conditions.length > 0
                      ? healthProfile.conditions.join(', ')
                      : 'None specified'}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Medications</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {healthProfile.medications.length > 0
                    ? healthProfile.medications.join(', ')
                    : 'None specified'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Allergies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {healthProfile.allergies.length > 0
                    ? healthProfile.allergies.join(', ')
                    : 'None specified'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Emergency Contacts</h3>
                {healthProfile.emergencyContacts.length > 0 ? (
                  <div className="space-y-2">
                    {healthProfile.emergencyContacts.map((contact: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contact.relationship}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">None specified</p>
                )}
              </div>

              <Button onClick={() => router.push('/health-profile')} variant="secondary">
                Update Health Profile
              </Button>
            </div>
          </Card>
        )}

        {user.isVolunteer && (
          <Card>
            <h2 className="text-2xl font-bold mb-4">Recent Reviews</h2>
            {(() => {
              const reviews = db.ratings.findByUser(user.id).slice(-5).reverse();
              return reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map(review => {
                    const reviewer = db.users.findById(review.raterId);
                    return (
                      <div key={review.id} className="border-b pb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{reviewer?.name}</span>
                          <span className="text-yellow-500">{'⭐'.repeat(review.score)}</span>
                        </div>
                        {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-500">No reviews yet</p>
              );
            })()}
          </Card>
        )}
      </div>
    </div>
  );
}
