'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useUserStore } from '@/store/userStore';
import { db } from '@/lib/db';
import { calculateSafetyScore } from '@/lib/utils';
import { SAFETY_QUESTIONS } from '@/lib/constants';

export default function QuestionnairePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [answers, setAnswers] = useState<boolean[]>(new Array(SAFETY_QUESTIONS.length).fill(false));

  const handleAnswer = (index: number, value: boolean) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!user) return;
    
    const safetyScore = calculateSafetyScore(answers);
    const updatedUser = db.users.update(user.id, { safetyScore });
    if (updatedUser) {
      setUser(updatedUser);
    }
    router.push('/health-profile');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <h1 className="text-3xl font-bold mb-6">Safety Assessment</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please answer these questions to help us assess your safety needs.
          </p>

          <div className="space-y-6">
            {SAFETY_QUESTIONS.map((q, index) => (
              <div key={q.id} className="border-b pb-4">
                <p className="font-medium mb-3">{index + 1}. {q.question}</p>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === true}
                      onChange={() => handleAnswer(index, true)}
                      className="w-5 h-5"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === false}
                      onChange={() => handleAnswer(index, false)}
                      className="w-5 h-5"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full mt-8">
            Continue
          </Button>
        </Card>
      </div>
    </div>
  );
}
