import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface LivraisonSimpleResponseDTO {
  idLivraison: number;
  nomClient: string;
  adresseLivraison: string;
  telephone: string;
  etatLivraison: string;
  dateCommande: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DashlivreurService {

  private baseUrl = 'http://localhost:8081/livraison';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getLivraisonsParLivreur(idUser: number): Observable<LivraisonSimpleResponseDTO[]> {
    console.log(`Appel API: ${this.baseUrl}/parid/${idUser}`);
    
    return this.http.get<any[]>(
      `${this.baseUrl}/parid/${idUser}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('Réponse brute de l\'API:', response);
        
        // Transformation des données pour convertir dateCommande en Date
        return response.map((item: any) => ({
          idLivraison: item.idLivraison,
          nomClient: item.nomClient,
          adresseLivraison: item.adresseLivraison,
          telephone: item.telephone,
          etatLivraison: item.etatLivraison,
          dateCommande: new Date(item.dateCommande)
        }));
      }),
      catchError(error => {
        console.error('Erreur détaillée:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Body:', error.error);
        return throwError(() => error);
      })
    );
  }
}