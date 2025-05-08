// panier.component.ts
import { Component, OnInit } from '@angular/core';
import { PanierService } from '../services/panier.service';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  platsDansPanier: any[] = [];
  couponCode: string = '';
  fraisLivraison: number = 0; // Livraison gratuite par défaut
  codePromoApplique: boolean = false;
  remise: number = 0;
  nombreArticles: number = 0;

  constructor(private panierService: PanierService) {}

  ngOnInit() {
    const storedPanier = localStorage.getItem('panier');
    if (storedPanier) {
      this.platsDansPanier = JSON.parse(storedPanier);
      
      // Vérifier et réparer les quantités au besoin
      this.platsDansPanier.forEach(plat => {
        if (plat.quantite < 1) {
          plat.quantite = 1;  // Si la quantité est inférieure à 1, on la réinitialise à 1
        }
      });
  
      this.calculerNombreArticles();  // Recalculer le nombre d'articles au chargement
    }
  }
  
  // Méthode ajouter : procéder au paiement
  procederAuPaiement(): void {
    console.log('Procédure de paiement lancée', this.platsDansPanier);
    // Ici tu peux rediriger vers une page de paiement
  }

  // Calculer le sous-total pour un plat spécifique
  calculerSousTotal(plat: any): number {
    return plat.prix * plat.quantite;
  }

  // Calculer le total du panier (produits + frais livraison - remise)
  calculerTotal(): number {
    const totalProduits = this.platsDansPanier.reduce(
      (total, plat) => total + this.calculerSousTotal(plat),
      0
    );
    return totalProduits + this.fraisLivraison - this.remise;
  }

  // Calculer le nombre total d'articles dans le panier
  calculerNombreArticles(): void {
    // Additionner les quantités de tous les plats dans le panier
    this.nombreArticles = this.platsDansPanier.reduce((acc: number, plat: any) => acc + plat.quantite, 0);
    
    // Mettre à jour le nombre d'articles dans le service
    this.panierService.setNombreArticles(this.nombreArticles);
  }
  
  // Mettre à jour la quantité d'un plat dans le panier
  mettreAJourQuantite(index: number, nouvelleQuantite: number): void {
    if (nouvelleQuantite >= 1) {
      this.platsDansPanier[index].quantite = nouvelleQuantite;
      this.mettreAJourLocalStorage();
      this.calculerNombreArticles();  // Recalculer le nombre d'articles
    }
  }

  // Supprimer un plat du panier
  supprimerDuPanier(index: number): void {
    this.platsDansPanier.splice(index, 1);
    this.mettreAJourLocalStorage();
    this.calculerNombreArticles();  // Recalculer le nombre d'articles
  }

  // Mettre à jour le panier dans le localStorage
  mettreAJourLocalStorage(): void {
    localStorage.setItem('panier', JSON.stringify(this.platsDansPanier));
  }

  // Mettre à jour le panier et afficher un message de confirmation
  updatePanier(): void {
    this.mettreAJourLocalStorage();
    alert('Order confirmed!');
  }
}
