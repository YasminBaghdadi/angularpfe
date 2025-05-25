import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccueilpanierService {
  private nombreArticlesSubject = new BehaviorSubject<number>(0);
  nombreArticles$ = this.nombreArticlesSubject.asObservable();
  private panierSubject = new BehaviorSubject<any[]>([]);
  panier$ = this.panierSubject.asObservable();
  
  private readonly PANIER_KEY = 'panier';

  constructor() {
    this.mettreAJourPanier();
  }

  private mettreAJourPanier(): void {
    const panier = this.getFromLocalStorage(this.PANIER_KEY) || [];
    const nombreArticles = panier.reduce((acc, plat) => acc + plat.quantite, 0);
    
    this.nombreArticlesSubject.next(nombreArticles);
    this.panierSubject.next(panier);
  }

  private getFromLocalStorage(key: string): any[] {
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  }

  private saveToLocalStorage(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
    this.mettreAJourPanier();
  }

  ajouterAuPanier(nouveauPlat: any): void {
    let panier = this.getFromLocalStorage(this.PANIER_KEY);
    const platExistant = panier.find(p => p.idPlat === nouveauPlat.idPlat);
  
    if (platExistant) {
      platExistant.quantite += nouveauPlat.quantite;
    } else {
      panier.push({ ...nouveauPlat });
    }
  
    this.saveToLocalStorage(this.PANIER_KEY, panier);
  }

  getPanier(): any[] {
    return this.getFromLocalStorage(this.PANIER_KEY);
  }

  supprimerDuPanier(index: number): void {
    let panier = this.getFromLocalStorage(this.PANIER_KEY);
    panier.splice(index, 1);
    this.saveToLocalStorage(this.PANIER_KEY, panier);
  }

  mettreAJourQuantite(index: number, nouvelleQuantite: number): void {
    if (nouvelleQuantite < 1) return;
    
    let panier = this.getFromLocalStorage(this.PANIER_KEY);
    if (panier[index]) {
      panier[index].quantite = nouvelleQuantite;
      this.saveToLocalStorage(this.PANIER_KEY, panier);
    }
  }

  clearPanier(): void {
    localStorage.removeItem(this.PANIER_KEY);
    this.mettreAJourPanier();
  }

  calculerTotal(): number {
    const panier = this.getPanier();
    return panier.reduce((total, plat) => total + (plat.prix * plat.quantite), 0);
  }
}