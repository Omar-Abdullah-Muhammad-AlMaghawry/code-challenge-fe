import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { BaseHttpService } from './base-http.service';

interface LoginResponse {
  token:    string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseHttpService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY  = 'user';

  private router = inject(Router);

  register(username: string, password: string): Observable<void> {
    return this.post<void>('/auth/register', { username, password });
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY,  res.username);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): string {
    return localStorage.getItem(this.USER_KEY) ?? 'User';
  }
}
