import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
export class ProfilreservationService {

  private baseUrl = 'http://localhost:8081/reservation';

  constructor(private http: HttpClient) {}

  updateReservation(id: number, reservation: Reservation): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${id}`, reservation);
  }
}
