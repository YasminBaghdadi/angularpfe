import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { roleGuard } from '../role/role.guard';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/auth';
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkToken();
  }

  login(credentials: {username: string, password: string}): Observable<any> {
  return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
    tap((response: any) => {
      if (response.token) {
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('user_role', response.role);
        localStorage.setItem('username', response.username);
        localStorage.setItem('user_id', response.idUser); 
        this.loggedIn.next(true);
      }
    })
  );
}

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    this.loggedIn.next(false);
    this.router.navigate(['/accueil']);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
 

  getToken(): string | null {
    return localStorage.getItem('access_token');
    
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getUserId(): number | null {
  const id = localStorage.getItem('user_id');
  return id ? parseInt(id) : null;
}

  private checkToken(): void {
    const token = this.getToken();
    this.loggedIn.next(!!token);
  }
}