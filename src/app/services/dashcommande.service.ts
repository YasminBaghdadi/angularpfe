import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

interface AdminCommandeRequest {
  typeCommande: string;
  platQuantites: { idPlat: number; quantite: number }[];
  userId?: number;
  adresse?: string;
  telephone?: string;
  tableNumber?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashcommandeService {
  private apiUrl = 'http://localhost:8081/commande';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getCommandesByType(type: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/type/${type}`);
  }

  supprimerCommande(idCmnd: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/supprimer/${idCmnd}`, { responseType: 'text' });
  }

  // Méthode modifiée pour supporter le statut de paiement
  modifierCommande(idCmnd: number, platQuantites: any[], statutPaiement?: string): Observable<any> {
    let params = new HttpParams();
    
    // Ajouter le statut de paiement en paramètre si fourni
    if (statutPaiement && statutPaiement.trim() !== '') {
      params = params.set('statutPaiement', statutPaiement);
    }

    console.log('🔄 Service - Modification commande ID:', idCmnd);
    console.log('📦 Service - Plats:', platQuantites);
    console.log('💳 Service - Statut paiement:', statutPaiement);

    return this.http.put(
      `${this.apiUrl}/modifier/${idCmnd}`, 
      platQuantites, 
      { 
        params: params,
        responseType: 'text' 
      }
    );
  }

  getCommande(idCmnd: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/getcommande/${idCmnd}`);
  }

  // Méthode mise à jour pour adminCreateCommande
  adminCreateCommande(request: AdminCommandeRequest): Observable<any> {
    console.log('🚀 Service - Création commande admin:', request);
    
    return this.http.post(
      `${this.apiUrl}/admin/create`, 
      request,
      { responseType: 'json' } // Changé de 'text' à 'json' pour recevoir l'objet de réponse
    );
  }
}