import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/** Decode a JWT and check the exp claim without any library. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('token');

  if (token && !isTokenExpired(token)) return true;

  // Token missing or expired — clear stale state and redirect
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.navigate(['/login']);
  return false;
};
