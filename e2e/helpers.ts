import { Page } from '@playwright/test';

// A real JWT with sub=testuser and exp=9999999999 (year 2286) — passes the client-side expiry check
export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6OTk5OTk5OTk5OX0.ZmFrZXNpZ25hdHVyZQ';
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
  { symbol: 'AAPL',  name: 'Apple Inc.',             price: 170.50, change:  2.30, changePercent:  1.37, market: 'USA', open: 168.20, dayHigh: 171.30, dayLow: 167.80, prevClose: 168.20 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',           price: 140.20, change: -1.50, changePercent: -1.06, market: 'USA', open: 142.10, dayHigh: 142.50, dayLow: 139.80, prevClose: 141.70 },
  { symbol: 'MSFT',  name: 'Microsoft Corporation',   price: 415.30, change:  5.10, changePercent:  1.24, market: 'USA', open: 410.50, dayHigh: 416.00, dayLow: 409.80, prevClose: 410.20 },
  { symbol: 'COMI',  name: 'Commercial Intl Bank',    price:  70.25, change:  1.10, changePercent:  1.59, market: 'EGX', open: 0, dayHigh: 0, dayLow: 0, prevClose: 0 },
  { symbol: 'HRHO',  name: 'Hermes',                  price:  15.40, change: -0.20, changePercent: -1.28, market: 'EGX', open: 0, dayHigh: 0, dayLow: 0, prevClose: 0 },
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

/** Generate deterministic mock history points for a stock (mimics backend mock data) */
function buildMockHistory(price: number, change: number, n = 30): { timestamp: number; price: number }[] {
  const prevClose = price - change;
  const now = Math.floor(Date.now() / 1000);
  const interval = Math.floor(86400 / (n - 1));
  const trend = (price - prevClose) / (n - 1);
  const pts = [];
  let p = prevClose;
  for (let i = 0; i < n; i++) {
    p = i === n - 1 ? price : p + trend + (Math.sin(i * 7.3) * price * 0.004);
    pts.push({ timestamp: now - (n - 1 - i) * interval, price: +p.toFixed(4) });
  }
  return pts;
}

/** Mock the history endpoint for all mock stocks */
export async function mockHistoryApi(page: Page): Promise<void> {
  await page.route('**/api/stocks/*/history**', route => {
    const url   = route.request().url();
    const sym   = url.match(/stocks\/([^/]+)\/history/)?.[1] ?? 'AAPL';
    const stock = STOCKS_MOCK.find(s => s.symbol === sym)
               ?? { price: 100, change: 1 };
    route.fulfill({ json: buildMockHistory(stock.price, stock.change) });
  });
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
 * Inject auth state into localStorage BEFORE the FIRST page load so the auth guard passes.
 * Uses a one-shot flag so the script doesn't re-inject after the user logs out.
 */
export async function setAuthState(page: Page, username = MOCK_USER): Promise<void> {
  await page.addInitScript(({ token, user }) => {
    // Only inject on the very first navigation of this test (flag not yet set).
    // After logout the flag persists so subsequent page.goto() calls don't restore the token.
    if (!localStorage.getItem('_authInjected')) {
      localStorage.setItem('token', token);
      localStorage.setItem('user',  user);
      localStorage.setItem('_authInjected', '1');
    }
  }, { token: MOCK_TOKEN, user: username });
}

/** Clear auth tokens before navigation (does NOT clear lang so language-persistence tests work). */
export async function clearAuthState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}
