import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
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
export class LivreurService {
private baseUrl = 'http://localhost:8081/projet';

  constructor(private http: HttpClient , private authService: AuthService) {}

  ajouterLivreur(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ajouterLivreur`, userData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'Unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.statusText;
    }
    return throwError(() => new Error(errorMessage));
  }




  getAlllivreurs(page: number = 0, size: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getAlllivreurs?page=${page}&size=${size}`);
  }


  
  // Updated method to include authentication token
  updateUser(id: number, userData: any): Observable<any> {
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

  getUserById(userId: number): Observable<any> {
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
