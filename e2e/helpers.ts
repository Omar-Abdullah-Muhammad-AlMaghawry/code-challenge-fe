import { Page } from '@playwright/test';

export const MOCK_TOKEN = 'mock-jwt-token-for-tests';
export const MOCK_USER  = 'testuser';

export const STATS_MOCK = [
  { label: 'Total Users',  value: '12,430', icon: 'group',          color: 'bg-blue-500' },
  { label: 'Revenue',      value: '$48,200', icon: 'attach_money',  color: 'bg-green-500' },
  { label: 'Orders',       value: '3,820',   icon: 'shopping_cart', color: 'bg-purple-500' },
  { label: 'Growth',       value: '+18%',    icon: 'trending_up',   color: 'bg-orange-500' },
];

export const ACTIVITY_MOCK = [
  { icon: 'person_add',   text: 'New user registered',        time: '2 mins ago',  color: 'text-blue-500' },
  { icon: 'check_circle', text: 'Order #1042 completed',      time: '15 mins ago', color: 'text-green-500' },
  { icon: 'warning',      text: 'Server CPU above 80%',       time: '1 hour ago',  color: 'text-orange-500' },
  { icon: 'star',         text: 'New 5-star review received', time: '3 hours ago', color: 'text-yellow-500' },
];

/** Mock all dashboard API calls */
export async function mockDashboardApi(page: Page): Promise<void> {
  await page.route('**/api/dashboard/stats',    route => route.fulfill({ json: STATS_MOCK }));
  await page.route('**/api/dashboard/activity', route => route.fulfill({ json: ACTIVITY_MOCK }));
}

/** Mock a successful login response */
export async function mockLoginSuccess(page: Page): Promise<void> {
  await page.route('**/api/auth/login', route =>
    route.fulfill({ json: { token: MOCK_TOKEN, username: MOCK_USER } }));
}

/** Mock a failed login response */
export async function mockLoginFailure(page: Page): Promise<void> {
  await page.route('**/api/auth/login', route =>
    route.fulfill({ status: 401, contentType: 'text/plain', body: 'Invalid username or password' }));
}

/**
 * Inject auth state into localStorage BEFORE page load so guards pass.
 * Uses addInitScript — runs on every navigation for this page.
 */
export async function setAuthState(page: Page, username = MOCK_USER): Promise<void> {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', user);   // key must match AuthService USER_KEY
  }, { token: MOCK_TOKEN, user: username });
}
