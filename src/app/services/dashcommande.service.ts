import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashcommandeService {
  private apiUrl = 'http://localhost:8081/commande'; // Adaptez l'URL

  constructor(private http: HttpClient , private authService: AuthService) { }

  getCommandesByType(type: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/type/${type}`);
  }

  supprimerCommande(idCmnd: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/supprimer/${idCmnd}`, { responseType: 'text' });
  }

  modifierCommande(idCmnd: number, platQuantites: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/modifier/${idCmnd}`, platQuantites, { responseType: 'text' });
  }


createSimpleCommande(platQuantites: {idPlat: number, quantite: number}[]): Observable<any> {
  const userId = this.authService.getUserId();
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }
  
  return this.http.post(
    `${this.apiUrl}/createBasic?idUser=${userId}&typeCommande=SUR_PLACE`,
    platQuantites
  );
}


}