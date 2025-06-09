import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

interface AdminCommandeRequest {
  typeCommande: string;
  platQuantites: { idPlat: number; quantite: number }[];
  userId?: number;
  username?: string;
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

  // Méthode modifiée pour supporter le statut de paiement ET l'état de livraison
  modifierCommande(idCmnd: number, platQuantites: any[], statutPaiement?: string, etatLivraison?: string): Observable<any> {
    let params = new HttpParams();
    
    // Ajouter le statut de paiement en paramètre si fourni
    if (statutPaiement && statutPaiement.trim() !== '') {
      params = params.set('statutPaiement', statutPaiement);
    }
    
    // Ajouter l'état de livraison en paramètre si fourni
    if (etatLivraison && etatLivraison.trim() !== '') {
      params = params.set('etatLivraison', etatLivraison);
    }
    console.log('🔄 Service - Modification commande ID:', idCmnd);
    console.log('📦 Service - Plats:', platQuantites);
    console.log('💳 Service - Statut paiement:', statutPaiement);
    console.log('🚚 Service - État livraison:', etatLivraison);
    return this.http.put(
      `${this.apiUrl}/modifier/${idCmnd}`, 
      platQuantites, 
      { 
        params: params,
        responseType: 'json' // Changé pour recevoir la liste des plats
      }
    );
  }
  
  getCommande(idCmnd: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/getcommande/${idCmnd}`);
  }

  adminCreateCommande(request: AdminCommandeRequest): Observable<any> {
    console.log('🚀 Service - Création commande admin:', request);
    
    return this.http.post(
      `${this.apiUrl}/admin/create`, 
      request,
      { responseType: 'json' }
    );
  }

  // Méthode pour changer l'état de livraison (méthode dédiée)
  changerEtatLivraison(idCmnd: number, nouvelEtat: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/livraison/${idCmnd}/etat`, 
      { etatLivraison: nouvelEtat },
      { responseType: 'text' }
    );
  }

  // Méthode pour assigner un livreur
  assignerLivreur(idCmnd: number, idLivreur: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/livraison/${idCmnd}/livreur`, 
      { idLivreur: idLivreur },
      { responseType: 'text' }
    );
  }

  // Méthode pour obtenir les détails de livraison
  getDetailsLivraison(idCmnd: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/livraison/${idCmnd}`);
  }


  getTotalCommandesByDateRange(dateDebut: string, dateFin: string): Observable<any> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);

    return this.http.get(`${this.apiUrl}/total-par-jour`, { params });
  }
}