import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
//================================
import { Observable, catchError, map, tap, throwError } from 'rxjs';
//================================

import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../models';

//================================
interface JwtPayload {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

function parseJwtUser(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as JwtPayload;
    return {
      _id: payload.id || payload._id || '',
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
//================================

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/auth`;

  // El usuario con sesión, o null si no hay sesión. Es privado y modificable aquí dentro;
  // fuera solo se puede leer (asReadonly), así nadie cambia la sesión sin pasar por este servicio
//================================
  private accessToken = signal<string | null>(null);
  private currentUser = signal<User | null>(null);
//================================
  readonly user = this.currentUser.asReadonly();

  // computed: se recalculan solos cada vez que cambia el usuario
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  /** POST /auth/register. No inicia sesión: la API no devuelve token y hay que hacer login */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data);
  }

  /** POST /auth/login. Si va bien, guarda los dos tokens y el usuario */
  login(credentials: LoginRequest): Observable<LoginResponse> {
//================================
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials, { withCredentials: true }).pipe(
      // tap: hago algo con la respuesta sin cambiarla; el componente la sigue recibiendo igual
      tap((response) => {
        this.accessToken.set(response.token);
        this.currentUser.set(response.user);
      }),
    );
//================================
  }

  /** POST /auth/refresh. Pide un access token nuevo con el refresh token y lo guarda */
  refresh(): Observable<string> {
//================================
    return this.http.post<RefreshResponse>(`${this.baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => {
        this.accessToken.set(response.token);
        if (!this.currentUser()) {
          const user = parseJwtUser(response.token);
          if (user) {
            this.currentUser.set(user);
          }
        }
      }),
      // map: de la respuesta { token } me quedo solo con el texto del token
      map((response) => response.token),
      catchError((error) => {
        this.accessToken.set(null);
        this.currentUser.set(null);
        return throwError(() => error);
      })
    );
//================================
  }

  /** Cierra la sesión: borra lo guardado y lleva al login */
  logout(): void {
//================================
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout(),
    });
  }

  private finalizeLogout(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
//================================

  /** El access token guardado, o null si no hay sesión. Lo usa el interceptor */
  getToken(): string | null {
//================================
    return this.accessToken();
//================================
  }
}