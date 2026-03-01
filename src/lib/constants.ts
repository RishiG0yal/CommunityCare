import { SafetyQuestion } from '@/types';

export const SAFETY_QUESTIONS: SafetyQuestion[] = [
  { id: '1', question: 'Do you live with family members or close relatives?', weight: 1 },
  { id: '2', question: 'Do you have regular contact with neighbors?', weight: 1 },
  { id: '3', question: 'Do you have a working phone with emergency contacts saved?', weight: 1.5 },
  { id: '4', question: 'Is your home equipped with safety features (handrails, good lighting)?', weight: 1.2 },
  { id: '5', question: 'Do you have access to nearby medical facilities?', weight: 1.3 },
  { id: '6', question: 'Do you regularly take medications as prescribed?', weight: 1.2 },
  { id: '7', question: 'Do you have someone who checks on you regularly?', weight: 1.4 },
  { id: '8', question: 'Are you comfortable using basic technology (phone, apps)?', weight: 0.8 },
  { id: '9', question: 'Do you have a support system for emergencies?', weight: 1.5 },
  { id: '10', question: 'Do you feel safe in your neighborhood?', weight: 1 },
];

export const HELP_CATEGORIES = [
  { value: 'shopping', label: 'Shopping & Groceries' },
  { value: 'medicine', label: 'Medicine Pickup' },
  { value: 'healthcare', label: 'Healthcare Assistance' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'companionship', label: 'Companionship' },
  { value: 'learning', label: 'Learning & Skills' },
  { value: 'other', label: 'Other' },
];

export const URGENCY_LEVELS = [
  { value: 'low', label: 'Low - Can wait a few days', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium - Within 24 hours', color: 'bg-yellow-500' },
  { value: 'high', label: 'High - Within a few hours', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical - Immediate attention', color: 'bg-red-500' },
];

export const HEALTH_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Alzheimer\'s',
  'Parkinson\'s',
  'Chronic Pain',
  'Mobility Issues',
  'Vision Impairment',
  'Hearing Impairment',
  'Other',
];
