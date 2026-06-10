import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { TokenPair, User } from '../models/api.models';

interface TokenPayload {
  sub: string;
  role: 'user' | 'admin';
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:8000/api/auth';
  readonly currentUser = signal<User | null>(null);
  private refreshInFlight: Observable<boolean> | null = null;

  constructor(private readonly http: HttpClient) {
    this.ensureAuthenticated().subscribe();
  }

  get accessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  get refreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  get role(): 'user' | 'admin' | null {
    return this.tokenPayload()?.role ?? null;
  }

  login(email: string, password: string) {
    return this.http.post<TokenPair>(`${this.baseUrl}/login`, { email, password }).pipe(tap((tokens) => this.store(tokens)));
  }

  register(username: string, email: string, password: string) {
    return this.http.post<TokenPair>(`${this.baseUrl}/register`, { username, email, password }).pipe(tap((tokens) => this.store(tokens)));
  }

  loadMe() {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(tap((user) => this.currentUser.set(user)));
  }

  refreshSession(): Observable<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refresh_token = this.refreshToken;
    if (!refresh_token) {
      this.clear();
      return of(false);
    }

    this.refreshInFlight = this.http.post<TokenPair>(`${this.baseUrl}/refresh`, { refresh_token }).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      switchMap(() => this.loadMe()),
      map(() => true),
      catchError(() => {
        this.clear();
        return of(false);
      }),
      finalize(() => this.refreshInFlight = null),
      shareReplay(1)
    );
    return this.refreshInFlight;
  }

  ensureAuthenticated(): Observable<boolean> {
    if (this.accessToken && !this.isAccessTokenExpired(10)) {
      if (this.currentUser()) return of(true);
      return this.loadMe().pipe(
        map(() => true),
        catchError(() => {
          this.clear();
          return of(false);
        })
      );
    }

    if (this.refreshToken) {
      return this.refreshSession();
    }

    this.clear();
    return of(false);
  }

  ensureAdmin(): Observable<boolean> {
    return this.ensureAuthenticated().pipe(map((authenticated) => authenticated && this.role === 'admin'));
  }

  logout() {
    const refresh_token = this.refreshToken;
    this.clear();
    if (refresh_token) {
      this.http.post(`${this.baseUrl}/logout`, { refresh_token }).subscribe();
    }
  }

  store(tokens: TokenPair) {
    this.storeTokens(tokens);
    this.loadMe().subscribe();
  }

  private storeTokens(tokens: TokenPair) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  clear() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return Boolean(this.accessToken && !this.isAccessTokenExpired());
  }

  private tokenPayload(): TokenPayload | null {
    if (!this.accessToken) return null;
    try {
      return jwtDecode<TokenPayload>(this.accessToken);
    } catch {
      return null;
    }
  }

  private isAccessTokenExpired(bufferSeconds = 0): boolean {
    const payload = this.tokenPayload();
    if (!payload?.exp) return true;
    return payload.exp * 1000 <= Date.now() + bufferSeconds * 1000;
  }
}
