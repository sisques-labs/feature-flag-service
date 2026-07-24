import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  apiKey: process.env.FEATURE_FLAGS_API_KEY,
}));
