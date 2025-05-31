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

  // Modifier une réservation
  updateReservation(idReservation: number, reservationData: {
    nomClient: string;
    dateReservation: Date | string;
    numberPersonne: number;
    numeroTel: number | string;
    idTable: number | string;
  }): Observable<Reservation> {
    // Préparer le corps de la requête avec tout en string
    const body = {
      nomClient: reservationData.nomClient,
      dateReservation: typeof reservationData.dateReservation === 'string'
        ? reservationData.dateReservation
        : this.formatDate(reservationData.dateReservation),
      numberPersonne: reservationData.numberPersonne.toString(),
      numeroTel: reservationData.numeroTel.toString(),
      idTable: reservationData.idTable.toString()
    };

    return this.http.put<Reservation>(
      `${this.baseApiUrl}/modifier/${idReservation}`, 
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }




  
 updateReservationparclient(idReservation: number, reservationData: {
    nomClient: string;
    dateReservation: Date | string;
    numberPersonne: number;
    numeroTel: number | string;
  }): Observable<Reservation> {
    // Préparer le corps de la requête avec tout en string
    const body = {
      nomClient: reservationData.nomClient,
      dateReservation: typeof reservationData.dateReservation === 'string'
        ? reservationData.dateReservation
        : this.formatDate(reservationData.dateReservation),
      numberPersonne: reservationData.numberPersonne.toString(),
      numeroTel: reservationData.numeroTel.toString()
    };

    return this.http.put<Reservation>(
      `${this.baseApiUrl}/update/${idReservation}`, 
      body,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }




  // Supprimer une réservation
  deleteReservation(idReservation: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseApiUrl}/delete/${idReservation}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // Méthode privée pour formatter la date au format attendu par le backend
  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }


  reserveradmin(data: {nomClient: string; dateReservation: string; numberPersonne: number; numeroTel: number}): Observable<any> {
  return this.http.post<any>(`${this.baseApiUrl}/reserver`, data, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(error => throwError(() => error))
  );
}

}
