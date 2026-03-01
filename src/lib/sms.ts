export const sendSMS = (phone: string, message: string) => {
  console.log(`📱 SMS to ${phone}: ${message}`);
  if (typeof window !== 'undefined') {
    const smsLog = localStorage.getItem('smsLog') || '[]';
    const logs = JSON.parse(smsLog);
    logs.push({ phone, message, timestamp: new Date().toISOString() });
    localStorage.setItem('smsLog', JSON.stringify(logs));
  }
  return true;
};

export const getSMSLog = () => {
  if (typeof window === 'undefined') return [];
  const smsLog = localStorage.getItem('smsLog') || '[]';
  return JSON.parse(smsLog);
};
