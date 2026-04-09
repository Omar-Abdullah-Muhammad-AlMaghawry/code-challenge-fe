import { Page } from '@playwright/test';

export const MOCK_TOKEN = 'mock-jwt-token-for-tests';
export const MOCK_USER  = 'testuser';

export const STATS_MOCK = [
  { label: 'Total Users',  value: '12,430',  icon: 'group',          color: 'bg-blue-500'   },
  { label: 'Revenue',      value: '$48,200', icon: 'attach_money',   color: 'bg-green-500'  },
  { label: 'Orders',       value: '3,820',   icon: 'shopping_cart',  color: 'bg-purple-500' },
  { label: 'Growth',       value: '+18%',    icon: 'trending_up',    color: 'bg-orange-500' },
];

export const ACTIVITY_MOCK = [
  { icon: 'person_add',   text: 'New user registered',        time: '2 mins ago',  color: 'text-blue-500'   },
  { icon: 'check_circle', text: 'Order #1042 completed',      time: '15 mins ago', color: 'text-green-500'  },
  { icon: 'warning',      text: 'Server CPU above 80%',       time: '1 hour ago',  color: 'text-orange-500' },
  { icon: 'star',         text: 'New 5-star review received', time: '3 hours ago', color: 'text-yellow-500' },
];

export const STOCKS_MOCK = [
  { symbol: 'AAPL',  name: 'Apple Inc.',             price: 170.50, change:  2.30, changePercent:  1.37, market: 'USA' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',           price: 140.20, change: -1.50, changePercent: -1.06, market: 'USA' },
  { symbol: 'MSFT',  name: 'Microsoft Corporation',   price: 415.30, change:  5.10, changePercent:  1.24, market: 'USA' },
  { symbol: 'COMI',  name: 'Commercial Intl Bank',    price:  70.25, change:  1.10, changePercent:  1.59, market: 'EGX' },
  { symbol: 'HRHO',  name: 'Hermes',                  price:  15.40, change: -0.20, changePercent: -1.28, market: 'EGX' },
];

/** Mock all dashboard API calls */
export async function mockDashboardApi(page: Page): Promise<void> {
  await page.route('**/api/dashboard/stats',    route => route.fulfill({ json: STATS_MOCK }));
  await page.route('**/api/dashboard/activity', route => route.fulfill({ json: ACTIVITY_MOCK }));
}

/** Mock stocks API */
export async function mockStocksApi(page: Page, data = STOCKS_MOCK): Promise<void> {
  await page.route('**/api/stocks**', route => route.fulfill({ json: data }));
}

/** Mock stocks API to return an error */
export async function mockStocksError(page: Page): Promise<void> {
  await page.route('**/api/stocks**', route => route.fulfill({ status: 500, body: 'error' }));
}

/** Mock a successful login response */
export async function mockLoginSuccess(page: Page): Promise<void> {
  await page.route('**/api/auth/login', route =>
    route.fulfill({ json: { token: MOCK_TOKEN, username: MOCK_USER } }));
}

/** Mock a failed login response */
export async function mockLoginFailure(page: Page): Promise<void> {
  await page.route('**/api/auth/login', route =>
    route.fulfill({ status: 401, contentType: 'text/plain', body: 'Unauthorized' }));
}

/** Mock a successful register response */
export async function mockRegisterSuccess(page: Page): Promise<void> {
  await page.route('**/api/auth/register', route => route.fulfill({ status: 200 }));
}

/** Mock a failed register response (e.g. username taken) */
export async function mockRegisterFailure(page: Page): Promise<void> {
  await page.route('**/api/auth/register', route =>
    route.fulfill({ status: 400, contentType: 'text/plain', body: 'Username already exists' }));
}

/**
 * Inject auth state into localStorage BEFORE page load so the auth guard passes.
 * Uses addInitScript — runs on every navigation for this page instance.
 */
export async function setAuthState(page: Page, username = MOCK_USER): Promise<void> {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user',  user);
  }, { token: MOCK_TOKEN, user: username });
}

/** Clear auth tokens before navigation. */
export async function clearAuthState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lang');
  });
}
