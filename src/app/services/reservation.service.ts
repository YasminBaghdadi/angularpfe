import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Interface pour typer les réservations
export interface Reservation {
  id: number;
  nomClient: string;
  dateReservation: Date;
  numberPersonne: number;
  numeroTel: number;
  tab: {
    id: number;
    number: number;
  };
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private baseApiUrl = 'http://localhost:8081/reservation';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Créer une réservation
  reserver(idUser: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/reserver/${idUser}`, data, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // Récupérer les réservations d'un utilisateur
  getReservationsByUser(userId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseApiUrl}/user/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // Récupérer toutes les réservations
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseApiUrl}/getall`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  
 updateReservation(idReservation: number, reservationData: any): Observable<Reservation> {
    return this.http.put<Reservation>(
      `${this.baseApiUrl}/modifier/${idReservation}`, 
      reservationData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // Méthode pour supprimer une réservation
  deleteReservation(idReservation: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseApiUrl}/delete/${idReservation}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
}