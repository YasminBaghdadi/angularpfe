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
  
  // Frais de livraison constants
  private readonly FRAIS_LIVRAISON = 5.00; // 5 TND

  constructor(
    private commandeService: CommandeService,
    private authService: AuthService
  ) {
    // Initialiser le panier au démarrage
    this.initialiserPanier();
    
    // Écouter les changements de connexion pour mettre à jour le panier
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.initialiserPanier();
      } else {
        // Si déconnecté, vider le panier observable mais garder localStorage pour les anonymes
        this.nombreArticlesSubject.next(0);
        this.panierSubject.next([]);
        this.panierBloqueSubject.next(false);
      }
    });
  }

  // Nouvelle méthode pour initialiser correctement le panier
  private initialiserPanier(): void {
    const panier = this.getFromLocalStorage(this.getPanierKey()) || [];
    const nombreArticles = panier.reduce((acc, plat) => acc + plat.quantite, 0);
    
    console.log('Initialisation panier:', panier); // Debug
    
    // Mettre à jour les observables avec les données du localStorage
    this.panierSubject.next([...panier]); // Créer une nouvelle référence
    this.nombreArticlesSubject.next(nombreArticles);
    
    // Vérifier s'il y a une commande en attente pour bloquer le panier
    const commandeEnAttente = this.commandeService.getCommandeEnAttente();
    this.panierBloqueSubject.next(!!commandeEnAttente);
  }

  private mettreAJourPanier(): void {
    // Cette méthode est maintenant simplifiée et appelle initialiserPanier
    this.initialiserPanier();
  }

  // Méthode pour obtenir les frais de livraison
  getFraisLivraison(): number {
    return this.FRAIS_LIVRAISON;
  }

  // Générer la clé unique pour chaque utilisateur
  private getPanierKey(): string {
    const userId = this.authService.getUserId();
    return userId ? `${this.PANIER_BASE_KEY}${userId}` : 'panier_anonymous';
  }

  private getFromLocalStorage(key: string): any[] {
    try {
      const items = localStorage.getItem(key);
      const result = items ? JSON.parse(items) : [];
      console.log(`Lecture localStorage [${key}]:`, result); // Debug
      return result;
    } catch (error) {
      console.error('Erreur lecture localStorage:', error);
      return [];
    }
  }

  private saveToLocalStorage(key: string, data: any[]): void {
    try {
      console.log(`Sauvegarde localStorage [${key}]:`, data); // Debug
      localStorage.setItem(key, JSON.stringify(data));
      
      // Mettre à jour immédiatement les observables avec les nouvelles données
      this.panierSubject.next([...data]); // Créer une nouvelle référence
      const nombreArticles = data.reduce((acc, plat) => acc + plat.quantite, 0);
      this.nombreArticlesSubject.next(nombreArticles);
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
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
    // Retourner les données des observables plutôt que localStorage directement
    return this.panierSubject.value;
  }

  supprimerDuPanier(index: number): boolean {
    if (this.verifierPanierBloque()) {
      console.warn('Impossible de supprimer du panier : commande en attente de paiement');
      return false;
    }

    const panierKey = this.getPanierKey();
    let panier = [...this.panierSubject.value]; // Utiliser les données de l'observable
    
    if (index >= 0 && index < panier.length) {
      panier.splice(index, 1);
      this.saveToLocalStorage(panierKey, panier);
      return true;
    }
    return false;
  }

  mettreAJourQuantite(index: number, nouvelleQuantite: number): boolean {
    if (this.verifierPanierBloque()) {
      console.warn('Impossible de modifier la quantité : commande en attente de paiement');
      return false;
    }

    if (nouvelleQuantite < 1) return false;
    
    const panierKey = this.getPanierKey();
    let panier = [...this.panierSubject.value]; // Utiliser les données de l'observable
    
    if (index >= 0 && index < panier.length) {
      panier[index].quantite = nouvelleQuantite;
      this.saveToLocalStorage(panierKey, panier);
      return true;
    }
    return false;
  }

  clearPanier(): void {
    const panierKey = this.getPanierKey();
    console.log('Suppression panier:', panierKey); // Debug
    
    try {
      localStorage.removeItem(panierKey);
      
      // Mettre à jour immédiatement les observables
      this.panierSubject.next([]);
      this.nombreArticlesSubject.next(0);
      
      console.log('Panier vidé avec succès'); // Debug
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error);
    }
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
    
    // Réinitialiser les observables
    this.panierSubject.next([]);
    this.nombreArticlesSubject.next(0);
  }

  // Calculer le sous-total sans frais de livraison
  calculerSousTotal(): number {
    const panier = this.panierSubject.value; // Utiliser l'observable
    return panier.reduce((total, plat) => total + (plat.prix * plat.quantite), 0);
  }

  // Calculer le total avec frais de livraison
  calculerTotal(): number {
    const sousTotal = this.calculerSousTotal();
    return sousTotal + this.FRAIS_LIVRAISON;
  }

  // Vérifier si l'utilisateur peut passer une nouvelle commande
  peutPasserCommande(): boolean {
    const commandeEnAttente = this.commandeService.getCommandeEnAttente();
    return !commandeEnAttente;
  }

  // Méthode pour forcer la synchronisation (si nécessaire pour le debug)
  forcerSynchronisation(): void {
    console.log('Forcer synchronisation du panier');
    this.initialiserPanier();
  }

  async passerCommandeLivraison(infoLivraison: any): Promise<any> {
    // Vérifier d'abord s'il n'y a pas déjà une commande en attente
    if (!this.peutPasserCommande()) {
      throw new Error('Une commande est déjà en attente de paiement. Veuillez d\'abord la payer ou l\'annuler.');
    }

    const panier = this.panierSubject.value; // Utiliser l'observable
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
      telephone: infoLivraison.telephone,
      fraisLivraison: this.FRAIS_LIVRAISON
    };

    try {
      const userIdNumber = Number(userId);
      console.log('UserID utilisé pour la commande:', userIdNumber, 'Type:', typeof userIdNumber);
      
      const response = await this.commandeService.passerCommandeLivraison(userIdNumber, commandeRequest).toPromise();
      
      const sousTotal = this.calculerSousTotal();
      const commandeEnAttente = {
        id: response.idCmnd,
        sousTotal: sousTotal,
        fraisLivraison: this.FRAIS_LIVRAISON,
        montantTotal: sousTotal + this.FRAIS_LIVRAISON,
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
      
      // Vider le panier et bloquer les modifications
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