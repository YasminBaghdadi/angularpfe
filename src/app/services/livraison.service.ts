// src/app/services/livraison.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface LivraisonResponseDTO {
  nomClient: string;
  prenomClient: string;
  adresseLivraison: string;
  telephoneLivraison: string;
  usernameLivreur: string;
}

export interface LivraisonSimpleResponseDTO {
  idLivraison: number; 
  idCmnd: String;
  nomClient: string;
  adresseLivraison: string;
  telephone: string;
  etatLivraison: string;
  dateCommande: string;

}

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private baseUrl = 'http://localhost:8081/livraison'; // à adapter selon ton backend

  constructor(private http: HttpClient) {}

  assignerLivraison(idCommande: number, usernameLivreur: string): Observable<LivraisonResponseDTO> {
    const params = new HttpParams()
      .set('idCommande', idCommande)
      .set('usernameLivreur', usernameLivreur);

    return this.http.post<LivraisonResponseDTO>(`${this.baseUrl}/assigner`, null, { params });
  }

  getLivraisonsParLivreur(username: string): Observable<LivraisonSimpleResponseDTO[]> {
  return this.http.get<LivraisonSimpleResponseDTO[]>(`${this.baseUrl}/par-livreur/${username}`);
}



deleteLivraison(idLivraison: number): Observable<string> {
  return this.http.delete(`${this.baseUrl}/delete/${idLivraison}`, { responseType: 'text' });
}


changerEtatLivraison(idLivraison: number, nouvelEtat: string): Observable<string> {
  const params = new HttpParams().set('nouvelEtat', nouvelEtat);

  return this.http.put(`${this.baseUrl}/changer-etat/${idLivraison}`, null, {
    params,
    responseType: 'text'
  });
}

}
