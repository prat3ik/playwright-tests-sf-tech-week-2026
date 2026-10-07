// tests/support/demo-user.ts
// Hard-coded account for the checkout journey. The demo store has no guest
// checkout (the Checkout button redirects a signed-out visitor to /login), so
// the test signs in with this fixed user at that point.
import type { UserData } from '../factories/user.factory';
import { withStoreApi } from './store-api';

export const demoUser: UserData = {
  firstname: 'SF TechWeek',
  lastname: 'Demo',
  email: 'sf-tech-week-demo@example.com',
  password: 'SecureP@ss123!',
};

export const demoAddress = {
  firstName: 'SF TechWeek Demo',
  email: demoUser.email,
  street: '1 Market St',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94105',
  country: 'USA',
};

/**
 * Registers the demo user if the store does not know it yet. The demo database
 * can be reset at any time, so a one-off manual registration is not enough.
 */
export async function ensureDemoUser(): Promise<void> {
  await withStoreApi(async (api) => {
    const res = await api.post('/api/register', { data: demoUser });
    if (res.ok()) return;
    const body = await res.text();
    if (/already exist/i.test(body)) return;
    throw new Error(`Could not ensure demo user ${demoUser.email}: ${res.status()} ${body}`);
  });
}
