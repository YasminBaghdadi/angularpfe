import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CommandeService } from './commande.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AccueilpanierService {
  private nombreArticlesSubject = new BehaviorSubject<number>(0);
  nombreArticles$ = this.nombreArticlesSubject.asObservable();
  
  private panierSubject = new BehaviorSubject<any[]>([]);
  panier$ = this.panierSubject.asObservable();
  
  // Nouveau BehaviorSubject pour l'état de blocage du panier
  private panierBloqueSubject = new BehaviorSubject<boolean>(false);
  panierBloque$ = this.panierBloqueSubject.asObservable();
  
  private readonly PANIER_BASE_KEY = 'panier_user_';

  constructor(
    private commandeService: CommandeService,
    private authService: AuthService
  ) {
    this.mettreAJourPanier();
    
    // Écouter les changements de connexion pour mettre à jour le panier
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.mettreAJourPanier();
      } else {
        // Si déconnecté, vider le panier observable
        this.nombreArticlesSubject.next(0);
        this.panierSubject.next([]);
        this.panierBloqueSubject.next(false);
      }
    });
  }

  // Générer la clé unique pour chaque utilisateur
  private getPanierKey(): string {
    const userId = this.authService.getUserId();
    return userId ? `${this.PANIER_BASE_KEY}${userId}` : 'panier_anonymous';
  }
  
  private mettreAJourPanier(): void {
    const panier = this.getFromLocalStorage(this.getPanierKey()) || [];
    const nombreArticles = panier.reduce((acc, plat) => acc + plat.quantite, 0);
    this.nombreArticlesSubject.next(nombreArticles);
    this.panierSubject.next(panier);
    
    // Vérifier s'il y a une commande en attente pour bloquer le panier
    const commandeEnAttente = this.commandeService.getCommandeEnAttente();
    this.panierBloqueSubject.next(!!commandeEnAttente);
  }

  private getFromLocalStorage(key: string): any[] {
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  }

  private saveToLocalStorage(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
    this.mettreAJourPanier();
  }

  // Vérifier si le panier est bloqué avant toute action
  private verifierPanierBloque(): boolean {
    const commandeEnAttente = this.commandeService.getCommandeEnAttente();
    return !!commandeEnAttente;
  }

  ajouterAuPanier(nouveauPlat: any): boolean {
    if (this.verifierPanierBloque()) {
      console.warn('Impossible d\'ajouter au panier : commande en attente de paiement');
      return false;
    }

    const panierKey = this.getPanierKey();
    let panier = this.getFromLocalStorage(panierKey);
    const platExistant = panier.find(p => p.idPlat === nouveauPlat.idPlat);
  
    if (platExistant) {
      platExistant.quantite += nouveauPlat.quantite;
    } else {
      panier.push({ ...nouveauPlat });
    }
  
    this.saveToLocalStorage(panierKey, panier);
    return true;
  }

  getPanier(): any[] {
    return this.getFromLocalStorage(this.getPanierKey());
  }

  supprimerDuPanier(index: number): boolean {
    if (this.verifierPanierBloque()) {
      console.warn('Impossible de supprimer du panier : commande en attente de paiement');
      return false;
    }

    const panierKey = this.getPanierKey();
    let panier = this.getFromLocalStorage(panierKey);
    panier.splice(index, 1);
    this.saveToLocalStorage(panierKey, panier);
    return true;
  }

  mettreAJourQuantite(index: number, nouvelleQuantite: number): boolean {
    if (this.verifierPanierBloque()) {
      console.warn('Impossible de modifier la quantité : commande en attente de paiement');
      return false;
    }

    if (nouvelleQuantite < 1) return false;
    
    const panierKey = this.getPanierKey();
    let panier = this.getFromLocalStorage(panierKey);
    if (panier[index]) {
      panier[index].quantite = nouvelleQuantite;
      this.saveToLocalStorage(panierKey, panier);
      return true;
    }
    return false;
  }

  clearPanier(): void {
    const panierKey = this.getPanierKey();
    localStorage.removeItem(panierKey);
    this.mettreAJourPanier();
  }

  // Nouvelle méthode pour forcer le nettoyage du panier (après paiement réussi)
  forcerNettoyagePanier(): void {
    this.clearPanier();
    this.panierBloqueSubject.next(false);
  }

  // Nettoyer tous les paniers (utile pour le nettoyage)
  clearAllPaniers(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PANIER_BASE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    this.mettreAJourPanier();
  }

  calculerTotal(): number {
    const panier = this.getPanier();
    return panier.reduce((total, plat) => total + (plat.prix * plat.quantite), 0);
  }

  // Vérifier si l'utilisateur peut passer une nouvelle commande
  peutPasserCommande(): boolean {
    const commandeEnAttente = this.commandeService.getCommandeEnAttente();
    return !commandeEnAttente;
  }

  async passerCommandeLivraison(infoLivraison: any): Promise<any> {
    // Vérifier d'abord s'il n'y a pas déjà une commande en attente
    if (!this.peutPasserCommande()) {
      throw new Error('Une commande est déjà en attente de paiement. Veuillez d\'abord la payer ou l\'annuler.');
    }

    const panier = this.getPanier();
    if (panier.length === 0) {
      throw new Error('Le panier est vide');
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      throw new Error('Utilisateur non connecté');
    }

    const commandeRequest = {
      platQuantites: panier.map(plat => ({
        idPlat: plat.idPlat,
        quantite: plat.quantite
      })),
      adresse: infoLivraison.adresse,
      telephone: infoLivraison.telephone
    };

    try {
      // Conversion explicite en nombre pour s'assurer du bon type
      const userIdNumber = Number(userId);
      console.log('UserID utilisé pour la commande:', userIdNumber, 'Type:', typeof userIdNumber);
      
      const response = await this.commandeService.passerCommandeLivraison(userIdNumber, commandeRequest).toPromise();
      
      // Sauvegarder la commande en attente
      const commandeEnAttente = {
        id: response.idCmnd,
        montantTotal: this.calculerTotal(),
        plats: panier.map(plat => ({
          idPlat: plat.idPlat,
          nom: plat.name,
          imageUrl: plat.imageUrl,
          quantite: plat.quantite,
          prix: plat.prix
        })),
        adresse: infoLivraison.adresse,
        telephone: infoLivraison.telephone,
        date: new Date()
      };
      
      this.commandeService.setCommandeEnAttente(commandeEnAttente);
      
      // Vider le panier de l'utilisateur actuel et bloquer les modifications
      this.clearPanier();
      this.panierBloqueSubject.next(true);
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la commande', error);
      throw error;
    }
  }

  // Méthode appelée après un paiement réussi
  onPaiementReussi(): void {
    this.commandeService.clearToutCommande();
    this.panierBloqueSubject.next(false);
    console.log('Paiement réussi - panier débloqué pour nouvelles commandes');
  }

  // Méthode pour annuler une commande en attente
  annulerCommandeEnAttente(): void {
    this.commandeService.clearToutCommande();
    this.panierBloqueSubject.next(false);
    console.log('Commande annulée - panier débloqué');
  }
}