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
  id?: number;
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
  private readonly STORAGE_BASE_KEY = 'commandeEnAttente_user_';
  private readonly TOTAL_BASE_KEY = 'totalCommandeEnCours_user_';
  
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
    
    // Écouter les changements de connexion
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadCommandeFromStorage();
        this.loadTotalFromStorage();
      } else {
        // Si déconnecté, vider les données
        this.commandeEnAttente = null;
        this.totalCommandeEnCours = 0;
        this.totalCommandeSubject.next(0);
      }
    });
  }

  // Générer les clés uniques pour chaque utilisateur
  private getStorageKey(): string {
    const userId = this.authService.getUserId();
    return userId ? `${this.STORAGE_BASE_KEY}${userId}` : 'commandeEnAttente_anonymous';
  }

  private getTotalStorageKey(): string {
    const userId = this.authService.getUserId();
    return userId ? `${this.TOTAL_BASE_KEY}${userId}` : 'totalCommandeEnCours_anonymous';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private loadCommandeFromStorage(): void {
    try {
      const storageKey = this.getStorageKey();
      const storedCommande = localStorage.getItem(storageKey);
      if (storedCommande) {
        this.commandeEnAttente = JSON.parse(storedCommande);
        if (this.commandeEnAttente) {
          this.commandeEnAttente.date = new Date(this.commandeEnAttente.date);
        }
      } else {
        this.commandeEnAttente = null;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la commande depuis le storage:', error);
      this.clearCommandeEnAttente();
    }
  }

  private loadTotalFromStorage(): void {
    try {
      const totalStorageKey = this.getTotalStorageKey();
      const storedTotal = localStorage.getItem(totalStorageKey);
      if (storedTotal) {
        this.totalCommandeEnCours = parseFloat(storedTotal);
        this.totalCommandeSubject.next(this.totalCommandeEnCours);
      } else {
        this.totalCommandeEnCours = 0;
        this.totalCommandeSubject.next(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du total:', error);
      this.totalCommandeEnCours = 0;
      this.totalCommandeSubject.next(0);
    }
  }

  private saveToStorage(): void {
    try {
      if (this.commandeEnAttente) {
        const storageKey = this.getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(this.commandeEnAttente));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
    }
  }

  private saveTotalToStorage(): void {
    try {
      const totalStorageKey = this.getTotalStorageKey();
      localStorage.setItem(totalStorageKey, this.totalCommandeEnCours.toString());
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
    const storageKey = this.getStorageKey();
    localStorage.removeItem(storageKey);
  }

  // Nettoyer tout (commande + total) pour l'utilisateur actuel
  clearToutCommande(): void {
    this.commandeEnAttente = null;
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
    
    const storageKey = this.getStorageKey();
    const totalStorageKey = this.getTotalStorageKey();
    localStorage.removeItem(storageKey);
    localStorage.removeItem(totalStorageKey);
  }

  // Nettoyer seulement le total (garder la commande)
  clearTotalCommande(): void {
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
    const totalStorageKey = this.getTotalStorageKey();
    localStorage.removeItem(totalStorageKey);
  }
  
  // Nettoyer toutes les données de tous les utilisateurs (utile pour maintenance)
  clearAllUsersData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_BASE_KEY) || key.startsWith(this.TOTAL_BASE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    this.commandeEnAttente = null;
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
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
    return this.http.post<any>(
      `${this.baseUrl}/passerlivraison/${idUser.toString()}`,
      request,
      { headers: this.getAuthHeaders() }
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





  getCommandesByUser(idUser: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${idUser}`);
  }


// 1. First, update your CommandeService method to better handle the response:

ajouterPlatsACommande(idCmnd: number, plats: PlatQuantite[]): Observable<any> {
  console.log('URL appelée:', `${this.baseUrl}/ajouterPlats/${idCmnd}`);
  console.log('Données envoyées:', plats);
  console.log('Headers:', this.getAuthHeaders());

  return this.http.post<any>(
    `${this.baseUrl}/ajouterPlats/${idCmnd}`,
    plats,
    { 
      headers: this.getAuthHeaders(),
      // Add this to see the full response
      observe: 'response'
    }
  ).pipe(
    catchError(error => {
      console.error('Erreur détaillée:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        headers: error.headers,
        error: error.error,
        message: error.message
      });
      
      // Check if it's a parsing error
      if (error.error instanceof ProgressEvent) {
        return throwError(() => 'Erreur de connexion au serveur. Vérifiez que le serveur est démarré.');
      }
      
      // Check for specific HTTP status codes
      if (error.status === 0) {
        return throwError(() => 'Impossible de joindre le serveur. Vérifiez la connexion.');
      }
      
      if (error.status === 404) {
        return throwError(() => 'Endpoint non trouvé. Vérifiez l\'URL du serveur.');
      }
      
      return throwError(() => error.error?.message || error.message || 'Erreur lors de l\'ajout de plats');
    })
  );
}




getCommandeById(idCommande: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/getcommande/${idCommande}`, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(error => {
      console.error('Erreur lors de la récupération de la commande:', error);
      return throwError(() => error.error?.message || error.message || 'Erreur lors de la récupération de la commande');
    })
  );
}
}