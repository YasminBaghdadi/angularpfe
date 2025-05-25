import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';

export interface User {
  idUser?: number;
  username: string;
  password?: string;
  confirmPassword?: string;
  email: string;
  firstname: string;
  lastname: string;
  role?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseUrl = 'http://localhost:8081/projet';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllUsers(page: number = 0, size: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getAllusers?page=${page}&size=${size}`);
  }

  deleteUser(userId: number): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete(`${this.baseUrl}/delete/${userId}`, { 
      headers,
      responseType: 'json'
    }).pipe(
      catchError(error => {
        console.error('Erreur complète:', error);
        return throwError(() => error.error || 'Erreur lors de la suppression');
      })
    );
  }

  // Updated method to include authentication token
  updateUser(id: number | string, userData: any): Observable<any> {
  const token = this.authService.getToken();
  if (!token) {
    return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.put(`${this.baseUrl}/updateuser/${id}`, userData, {
    headers
  }).pipe(
    catchError(error => {
      console.error('Erreur de mise à jour:', error);
      return throwError(() => error.error || 'Erreur lors de la mise à jour');
    })
  );
}

  getUserById(userId: number | string): Observable<any> {
  const token = this.authService.getToken();
  if (!token) {
    return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.get(`${this.baseUrl}/getUserById/${userId}`, {
    headers
  }).pipe(
    catchError(error => {
      return throwError(() => error.error || 'Erreur lors de la récupération des données');
    })
  );
}
}