import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PanierclientService {
 private nombreArticlesSubject = new BehaviorSubject<number>(0);
  nombreArticles$ = this.nombreArticlesSubject.asObservable();

  constructor() {
    this.mettreAJourNombreArticles();
  }

  // Mettre à jour le nombre d'articles en tenant compte de la quantité
  private mettreAJourNombreArticles(): void {
    const panier = JSON.parse(localStorage.getItem('panier') || '[]');
    
    // Calculer le nombre total d'articles en additionnant les quantités
    const nombreArticles = panier.reduce((acc: number, plat: any) => {
      return acc + plat.quantite; // Ajouter la quantité de chaque plat
    }, 0);
  
    // Mettre à jour le nombre d'articles dans le service
    this.nombreArticlesSubject.next(nombreArticles);
  }

  

  // Mettre à jour le nombre d'articles dans le service
  setNombreArticles(nombre: number): void {
    this.nombreArticlesSubject.next(nombre);
  }

  ajouterAuPanier(nouveauPlat: any): void {
    let panier = JSON.parse(localStorage.getItem('paniers') || '[]');
    
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
    localStorage.setItem('paniers', JSON.stringify(panier));

    this.mettreAJourNombreArticles();
  
  }

}

