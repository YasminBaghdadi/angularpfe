import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:8081/reservation/reserver';

constructor(private http: HttpClient, private authService: AuthService) {}

 reserver(idUser: string, data: any): Observable<any> {
  const token = this.authService.getToken();
const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  return this.http.post<any>(`${this.apiUrl}/${idUser}`, data, { headers }).pipe(
    catchError(error => throwError(() => error))
  );
}
}