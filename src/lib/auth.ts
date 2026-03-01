const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

const bcrypt = {
  hash: async (password: string, rounds: number = 10) => {
    if (typeof window === 'undefined') {
      const bcryptNode = await import('bcryptjs');
      return bcryptNode.default.hash(password, rounds);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password + JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  compare: async (password: string, hash: string) => {
    if (typeof window === 'undefined') {
      const bcryptNode = await import('bcryptjs');
      return bcryptNode.default.compare(password, hash);
    }
    const newHash = await bcrypt.hash(password);
    return newHash === hash;
  }
};

const jwt = {
  sign: (payload: any, secret: string, options?: any) => {
    if (typeof window === 'undefined') {
      const jwtNode = require('jsonwebtoken');
      return jwtNode.sign(payload, secret, options);
    }
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    return `${header}.${body}.signature`;
  },
  verify: (token: string, secret: string) => {
    if (typeof window === 'undefined') {
      const jwtNode = require('jsonwebtoken');
      return jwtNode.verify(token, secret);
    }
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() > payload.exp) throw new Error('Token expired');
    return payload;
  }
};

const getOTPStore = () => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('otp_store');
  return stored ? JSON.parse(stored) : {};
};

const saveOTPStore = (store: Record<string, { otp: string; expires: number }>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('otp_store', JSON.stringify(store));
};

export const auth = {
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  
  storeOTP: (identifier: string, otp: string) => {
    const store = getOTPStore();
    store[identifier] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
    };
    saveOTPStore(store);
  },
  
  verifyOTP: (identifier: string, otp: string) => {
    const store = getOTPStore();
    const stored = store[identifier];
    if (!stored) return false;
    if (Date.now() > stored.expires) {
      delete store[identifier];
      saveOTPStore(store);
      return false;
    }
    if (stored.otp === otp) {
      delete store[identifier];
      saveOTPStore(store);
      return true;
    }
    return false;
  },
  
  hashPassword: async (password: string) => {
    return bcrypt.hash(password, 10);
  },
  
  comparePassword: async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  },
  
  generateToken: (userId: string) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  },
  
  verifyToken: (token: string) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return { userId: decoded.userId };
    } catch {
      return null;
    }
  },
};
