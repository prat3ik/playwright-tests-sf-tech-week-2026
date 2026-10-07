// tests/factories/user.factory.ts
// Factory pattern from playwright-skill/core/test-data-management.md:
// one place that owns the shape of a user, guaranteed-unique by default.
import { randomUUID } from 'node:crypto';

export interface UserData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export function createUserData(overrides: Partial<UserData> = {}): UserData {
  const id = randomUUID().slice(0, 8);
  return {
    firstname: 'Play',
    lastname: 'Wright',
    email: `pw-${id}@example.com`,
    password: 'SecureP@ss123!',
    ...overrides,
  };
}

export function fullName(user: Pick<UserData, 'firstname' | 'lastname'>): string {
  return `${user.firstname} ${user.lastname}`;
}
