import { HttpInterceptorFn } from '@angular/common/http';

/** Endpoints that must never carry an Authorization header. */
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_PATHS.some(path => req.url.includes(path));
  if (isPublic) return next(req);

  const token = localStorage.getItem('token');
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
