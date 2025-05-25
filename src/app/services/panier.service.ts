import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private nombreArticlesSubject = new BehaviorSubject<number>(0);
  nombreArticles$ = this.nombreArticlesSubject.asObservable();
  
  private tableNumber: number | null = null;

 constructor() {
    // Charger le numéro de table ET le panier au démarrage
    const storedTableNumber = localStorage.getItem('tableNumber');
    if (storedTableNumber) {
      this.tableNumber = parseInt(storedTableNumber);
      // Charger immédiatement le panier correspondant
      this.mettreAJourNombreArticles();
    }
  }

  // Définir le numéro de table actuel
  setTableNumber(tableNumber: number): void {
    this.tableNumber = tableNumber;
    localStorage.setItem('tableNumber', tableNumber.toString());
    this.mettreAJourNombreArticles();
  }

  // Obtenir la clé du panier spécifique à la table
  private getPanierKey(): string {
    if (!this.tableNumber) {
      console.error('Aucun numéro de table défini');
      return 'panier_default';
    }
    return `panier_table_${this.tableNumber}`;
  }

  // Mettre à jour le nombre d'articles en tenant compte de la quantité
  private mettreAJourNombreArticles(): void {
    const panierKey = this.getPanierKey();
    const panier = this.getFromLocalStorage(panierKey) || [];
    
    // Calculer le nombre total d'articles en additionnant les quantités
    const nombreArticles = panier.reduce((acc: number, plat: any) => {
      return acc + plat.quantite; // Ajouter la quantité de chaque plat
    }, 0);
  
    // Mettre à jour le nombre d'articles dans le service
    this.nombreArticlesSubject.next(nombreArticles);
  }

  // Méthode utilitaire pour obtenir et parser les données du localStorage
  private getFromLocalStorage(key: string): any[] {
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  }

  // Méthode utilitaire pour sauvegarder des données dans localStorage
  private saveToLocalStorage(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Mettre à jour le nombre d'articles dans le service
  setNombreArticles(nombre: number): void {
    this.nombreArticlesSubject.next(nombre);
  }

  // Ajouter un plat au panier
  ajouterAuPanier(nouveauPlat: any): void {
    const panierKey = this.getPanierKey();
    let panier = this.getFromLocalStorage(panierKey);
    
    // Cherche si le plat est déjà dans le panier
    const platExistant = panier.find((p: any) => p.idPlat === nouveauPlat.idPlat);
  
    if (platExistant) {
      // Si le plat existe, on ajoute la quantité à celle déjà présente dans le panier
      platExistant.quantite += nouveauPlat.quantite;
    } else {
      // Sinon, on ajoute le plat avec la quantité
      panier.push({ ...nouveauPlat });
    }
  
    // Mise à jour du panier dans le localStorage
    this.saveToLocalStorage(panierKey, panier);
    this.mettreAJourNombreArticles();
  }

  // Obtenir le contenu du panier actuel
  getPanier(): any[] {
    const panierKey = this.getPanierKey();
    return this.getFromLocalStorage(panierKey);
  }

  // Supprimer un plat du panier
  supprimerDuPanier(index: number): void {
    const panierKey = this.getPanierKey();
    let panier = this.getFromLocalStorage(panierKey);
    
    panier.splice(index, 1);
    
    this.saveToLocalStorage(panierKey, panier);
    this.mettreAJourNombreArticles();
  }

  // Mettre à jour la quantité d'un plat
  mettreAJourQuantite(index: number, nouvelleQuantite: number): void {
    if (nouvelleQuantite < 1) return;
    
    const panierKey = this.getPanierKey();
    let panier = this.getFromLocalStorage(panierKey);
    
    if (panier[index]) {
      panier[index].quantite = nouvelleQuantite;
      this.saveToLocalStorage(panierKey, panier);
      this.mettreAJourNombreArticles();
    }
  }

  // Vider le panier
  clearPanier(): void {
    const panierKey = this.getPanierKey();
    localStorage.removeItem(panierKey);
    this.nombreArticlesSubject.next(0);
  }

  // Calculer le total du panier
  calculerTotal(): number {
    const panier = this.getPanier();
    return panier.reduce(
      (total, plat) => total + (plat.prix * plat.quantite),
      0
    );
  }
}