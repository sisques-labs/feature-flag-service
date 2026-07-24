/**
 * Shared API key used across E2E/integration tests — must be at least 32
 * characters to satisfy `FEATURE_FLAGS_API_KEY`'s env validation.
 */
export const TEST_API_KEY = 'test-api-key-'.padEnd(32, '0');
