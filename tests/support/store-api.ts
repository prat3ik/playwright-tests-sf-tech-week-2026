// tests/support/store-api.ts
// API seeding helper (playwright-skill/core/test-data-management.md, "API Seeding").
// Worker-scoped fixtures cannot use the test-scoped `request` fixture, so this
// builds its own APIRequestContext.
import { request, type APIRequestContext } from '@playwright/test';
import type { UserData } from '../factories/user.factory';

const apiURL = process.env.API_URL || 'https://storedemo-api.testdino.com';

export async function withStoreApi<T>(fn: (api: APIRequestContext) => Promise<T>): Promise<T> {
  const api = await request.newContext({ baseURL: apiURL });
  try {
    return await fn(api);
  } finally {
    await api.dispose();
  }
}

/** POST /api/register. Throws with the server's message if registration fails. */
export async function registerUser(user: UserData): Promise<void> {
  await withStoreApi(async (api) => {
    const res = await api.post('/api/register', { data: user });
    if (!res.ok()) {
      throw new Error(`Failed to register ${user.email}: ${res.status()} ${await res.text()}`);
    }
  });
}
