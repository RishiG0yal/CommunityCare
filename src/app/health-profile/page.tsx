'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { HEALTH_CONDITIONS } from '@/lib/constants';
import { validatePhone, sanitizeInput } from '@/lib/validation';

export default function HealthProfilePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: '', phone: '', relationship: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConditionToggle = (condition: string) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleAddContact = () => {
    setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relationship: '' }]);
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const newContacts = [...emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEmergencyContacts(newContacts);
  };

  const handleSubmit = () => {
    try {
      setLoading(true);
      setError('');

      if (!user) return;

      const validContacts = emergencyContacts.filter(c => c.name && c.phone);
      
      for (const contact of validContacts) {
        if (!validatePhone(contact.phone)) {
          setError(`Invalid phone number for ${contact.name}. Please use format: +1234567890 or (123) 456-7890`);
          return;
        }
      }

      db.healthProfiles.create({
        userId: user.id,
        conditions,
        medications: medications.split(',').map(m => sanitizeInput(m.trim())).filter(Boolean),
        allergies: allergies.split(',').map(a => sanitizeInput(a.trim())).filter(Boolean),
        emergencyContacts: validContacts.map(c => ({
          name: sanitizeInput(c.name),
          phone: c.phone,
          relationship: sanitizeInput(c.relationship),
        })),
      });

      router.push('/dashboard');
    } catch (err) {
      setError('Failed to save health profile. Please try again.');
      console.error('Health profile error:', err);
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
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <h1 className="text-3xl font-bold mb-6">Health Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            This information helps us provide better assistance in emergencies.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner text="Saving profile..." />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Health Conditions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {HEALTH_CONDITIONS.map(condition => (
                    <label key={condition} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={conditions.includes(condition)}
                        onChange={() => handleConditionToggle(condition)}
                        className="w-5 h-5"
                        disabled={loading}
                      />
                      <span>{condition}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Medications (comma-separated)"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="e.g., Aspirin, Metformin"
                disabled={loading}
              />

              <Input
                label="Allergies (comma-separated)"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g., Penicillin, Peanuts"
                disabled={loading}
              />

              <div>
                <h3 className="font-semibold mb-3">Emergency Contacts</h3>
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="space-y-2 mb-4 p-4 border rounded">
                    <Input
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Phone (e.g., +1234567890)"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Relationship"
                      value={contact.relationship}
                      onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                ))}
                <Button onClick={handleAddContact} variant="secondary" size="sm" disabled={loading}>
                  Add Another Contact
                </Button>
              </div>

              <div className="flex space-x-4">
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  Complete Setup
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="secondary" className="flex-1" disabled={loading}>
                  Skip for Now
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
