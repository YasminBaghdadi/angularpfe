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
  
  // CORRECTION: Map pour gérer les totaux par table
  private totalCommandeByTable = new Map<number, BehaviorSubject<number>>();
  
  // Variables pour la livraison (utilisateur connecté)
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

  // NOUVELLES MÉTHODES POUR LA GESTION PAR TABLE
  
  // Obtenir l'observable du total pour une table spécifique
  getTotalCommandeObservableForTable(tableNumber: number): Observable<number> {
    if (!this.totalCommandeByTable.has(tableNumber)) {
      // Créer un nouveau BehaviorSubject pour cette table avec la valeur stockée
      const initialValue = this.getStoredTotalForTable(tableNumber);
      this.totalCommandeByTable.set(tableNumber, new BehaviorSubject<number>(initialValue));
    }
    return this.totalCommandeByTable.get(tableNumber)!.asObservable();
  }

  // Obtenir le total stocké dans localStorage pour une table
  private getStoredTotalForTable(tableNumber: number): number {
    const stored = localStorage.getItem(`commandeEnCours_table_${tableNumber}`);
    return stored ? parseFloat(stored) : 0;
  }

  // Définir le total de commande pour une table spécifique
  setTotalCommandeEnCoursForTable(total: number, tableNumber: number): void {
    if (!this.totalCommandeByTable.has(tableNumber)) {
      this.totalCommandeByTable.set(tableNumber, new BehaviorSubject<number>(0));
    }
    
    this.totalCommandeByTable.get(tableNumber)!.next(total);
    
    // Sauvegarder aussi dans localStorage
    if (total > 0) {
      localStorage.setItem(`commandeEnCours_table_${tableNumber}`, total.toString());
    } else {
      localStorage.removeItem(`commandeEnCours_table_${tableNumber}`);
    }
  }

  // Obtenir le total actuel pour une table
  getTotalCommandeEnCoursForTable(tableNumber: number): number {
    if (this.totalCommandeByTable.has(tableNumber)) {
      return this.totalCommandeByTable.get(tableNumber)!.value;
    }
    return this.getStoredTotalForTable(tableNumber);
  }

  // Vider le total de commande pour une table spécifique
  clearTotalCommandeForTable(tableNumber: number): void {
    if (this.totalCommandeByTable.has(tableNumber)) {
      this.totalCommandeByTable.get(tableNumber)!.next(0);
    }
    localStorage.removeItem(`commandeEnCours_table_${tableNumber}`);
    localStorage.removeItem(`idCommande_table_${tableNumber}`);
    localStorage.removeItem(`detailsCommande_table_${tableNumber}`);
  }

  // MÉTHODES EXISTANTES POUR LA LIVRAISON (utilisateurs connectés)
  
  // Générer les clés uniques pour chaque utilisateur
  private getStorageKey(): string {
    const userId = this.authService.getUserId();
    return userId ? `${this.STORAGE_BASE_KEY}${userId}` : 'commandeEnAttente_anonymous';
  }

  private getTotalStorageKey(): string {
    const userId = this.authService.getUserId();
    return userId ? `totalCommandeEnCours_user_${userId}` : 'totalCommandeEnCours_anonymous';
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

  // MÉTHODES EXISTANTES POUR LA LIVRAISON (CONSERVÉES POUR COMPATIBILITÉ)
  setTotalCommandeEnCours(total: number): void {
    this.totalCommandeEnCours = total;
    this.totalCommandeSubject.next(total);
    this.saveTotalToStorage();
  }

  getTotalCommandeEnCours(): number {
    return this.totalCommandeEnCours;
  }

  // MÉTHODE MODIFIÉE POUR SUPPORTER LES DEUX MODES
  getTotalCommandeObservable(tableNumber?: number): Observable<number> {
    if (tableNumber !== undefined) {
      // Mode table (passager)
      return this.getTotalCommandeObservableForTable(tableNumber);
    } else {
      // Mode livraison (utilisateur connecté)
      return this.totalCommande$;
    }
  }

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

  clearToutCommande(): void {
    this.commandeEnAttente = null;
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
    
    const storageKey = this.getStorageKey();
    const totalStorageKey = this.getTotalStorageKey();
    localStorage.removeItem(storageKey);
    localStorage.removeItem(totalStorageKey);
  }

  clearTotalCommande(): void {
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
    const totalStorageKey = this.getTotalStorageKey();
    localStorage.removeItem(totalStorageKey);
  }
  
  clearAllUsersData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_BASE_KEY) || key.startsWith('totalCommandeEnCours_user_')) {
        localStorage.removeItem(key);
      }
    });
    this.commandeEnAttente = null;
    this.totalCommandeEnCours = 0;
    this.totalCommandeSubject.next(0);
  }

  getCommandeTotal(): number {
    return this.totalCommandeEnCours > 0 ? this.totalCommandeEnCours : (this.commandeEnAttente?.montantTotal || 0);
  }

  hasCommandeEnAttente(): boolean {
    return this.commandeEnAttente !== null || this.totalCommandeEnCours > 0;
  }

  // MÉTHODES HTTP (CONSERVÉES)
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

  ajouterPlatsACommande(idCmnd: number, plats: PlatQuantite[]): Observable<any> {
    console.log('URL appelée:', `${this.baseUrl}/ajouterPlats/${idCmnd}`);
    console.log('Données envoyées:', plats);
    console.log('Headers:', this.getAuthHeaders());

    return this.http.post<any>(
      `${this.baseUrl}/ajouterPlats/${idCmnd}`,
      plats,
      { 
        headers: this.getAuthHeaders(),
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
        
        if (error.error instanceof ProgressEvent) {
          return throwError(() => 'Erreur de connexion au serveur. Vérifiez que le serveur est démarré.');
        }
        
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