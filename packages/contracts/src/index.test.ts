import { expect, it } from 'vitest';
import { profileSchema, registerSchema, timezoneSchema } from './index';
it('normalizes usernames and emails without weakening passwords', () => {
  const parsed = registerSchema.parse({
    username: 'Person_1',
    email: 'PERSON@example.test',
    password: 'a long password 123',
  });
  expect(parsed.username).toBe('person_1');
  expect(parsed.email).toBe('person@example.test');
  expect(registerSchema.safeParse({ ...parsed, password: 'short' }).success).toBe(false);
});
it('rejects malformed identities and accepts real DST and non-DST zones', () => {
  expect(timezoneSchema.safeParse('America/New_York').success).toBe(true);
  expect(timezoneSchema.safeParse('Asia/Bishkek').success).toBe(true);
  expect(timezoneSchema.safeParse('Mars/Olympus').success).toBe(false);
  expect(
    profileSchema.safeParse({
      username: '../user',
      displayName: 'User',
      bio: '',
      timezone: 'UTC',
      onboardingCompleted: true,
    }).success,
  ).toBe(false);
});
