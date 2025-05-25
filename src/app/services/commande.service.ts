import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface PlatQuantite {
  idPlat: number;
  quantite: number;
}

export interface CommandeLivraisonRequest {
  platQuantites: PlatQuantite[];
  adresse: string;
  telephone: string;
}

interface CommandeEnAttente {
  id?: number; // Ajouter cette ligne
  montantTotal: number;
  plats: Array<{
    idPlat: number;
    nom: string;
    quantite: number;
    prix: number;
  }>;
  adresse: string;
  telephone: string;
  date: Date;
  isConfirmed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private baseUrl = 'http://localhost:8081/commande';
  private commandeEnAttente: CommandeEnAttente | null = null;
  private readonly STORAGE_KEY = 'commandeEnAttente';
  
  // Variables pour stocker le total et les détails de commande
  private totalCommandeSubject = new BehaviorSubject<number>(0);
  public totalCommande$ = this.totalCommandeSubject.asObservable();
  
  private totalCommandeEnCours: number = 0;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadCommandeFromStorage();
    this.loadTotalFromStorage();
  }

  private loadCommandeFromStorage(): void {
    try {
      const storedCommande = localStorage.getItem(this.STORAGE_KEY);
      if (storedCommande) {
        this.commandeEnAttente = JSON.parse(storedCommande);
        if (this.commandeEnAttente) {
          this.commandeEnAttente.date = new Date(this.commandeEnAttente.date);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la commande depuis le storage:', error);
      this.clearCommandeEnAttente();
    }
  }

  private loadTotalFromStorage(): void {
    try {
      const storedTotal = localStorage.getItem('totalCommandeEnCours');
      if (storedTotal) {
        this.totalCommandeEnCours = parseFloat(storedTotal);
        this.totalCommandeSubject.next(this.totalCommandeEnCours);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du total:', error);
    }
  }

  private saveToStorage(): void {
    try {
      if (this.commandeEnAttente) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.commandeEnAttente));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
    }
  }

  private saveTotalToStorage(): void {
    try {
      localStorage.setItem('totalCommandeEnCours', this.totalCommandeEnCours.toString());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du total:', error);
    }
  }

  

  getCommandeEnAttente(): CommandeEnAttente | null {
    return this.commandeEnAttente;
  }

  // Méthodes pour gérer le total de commande en cours
  setTotalCommandeEnCours(total: number): void {
    this.totalCommandeEnCours = total;
    this.totalCommandeSubject.next(total);
    this.saveTotalToStorage();
  }

  getTotalCommandeEnCours(): number {
    return this.totalCommandeEnCours;
  }

  // Observable pour le total
  getTotalCommandeObservable(): Observable<number> {
    return this.totalCommande$;
  }

  // Vérifier si il y a un total en cours
  hasTotalEnCours(): boolean {
    return this.totalCommandeEnCours > 0;
  }

  markCommandeAsConfirmed(): void {
    if (this.commandeEnAttente) {
      this.commandeEnAttente.isConfirmed = true;
      this.saveToStorage();
    }
  }

  isCommandeConfirmed(): boolean {
    return this.commandeEnAttente?.isConfirmed || false;
  }

  clearCommandeEnAttente(): void {
    this.commandeEnAttente = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Nettoyer tout (commande + total)
  clearToutCommande(): void {
    this.commandeEnAttente = null;
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
    
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('totalCommandeEnCours');
  }

  // Nettoyer seulement le total (garder la commande)
  clearTotalCommande(): void {
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
    localStorage.removeItem('totalCommandeEnCours');
  }

  getCommandeTotal(): number {
    // Priorité au total stocké séparément, sinon celui de la commande
    return this.totalCommandeEnCours > 0 ? this.totalCommandeEnCours : (this.commandeEnAttente?.montantTotal || 0);
  }

  hasCommandeEnAttente(): boolean {
    return this.commandeEnAttente !== null || this.totalCommandeEnCours > 0;
  }

  passerCommandeLivraison(
    idUser: number,
    request: CommandeLivraisonRequest
  ): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(
      `${this.baseUrl}/passerlivraison/${idUser}`,
      request,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la commande en livraison:', error);
        return throwError(() => error.error?.error || error.message || 'Erreur lors de la commande');
      })
    );
  }

  passerCommande(idTable: number, plats: PlatQuantite[], token: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/passerCommande/${idTable}`,
      plats,
      {
        headers: { 'X-Session-Token': token }
      }
    );
  }




  
  setCommandeEnAttente(commande: CommandeEnAttente): void {
  // Générer un ID temporaire si non fourni
  if (!commande.id) {
    commande.id = Math.floor(Math.random() * 1000000);
  }
  this.commandeEnAttente = { ...commande, isConfirmed: false };
  this.setTotalCommandeEnCours(commande.montantTotal);
  this.saveToStorage();
}
confirmerPaiementEspeces(idCommande: number): Observable<any> {
  const headers = new HttpHeaders({
    'X-Session-Token': localStorage.getItem('token') || ''
  });

  return this.http.post(
    `${this.baseUrl}/confirmerPaiementEspeces/${idCommande}`,
    null,
    { headers }
  ).pipe(
    catchError(error => {
      console.error('Erreur paiement espèces:', error);
      return throwError(() => error.error?.error || 'Erreur lors du paiement');
    })
  );
}
}