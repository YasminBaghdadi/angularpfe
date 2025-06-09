import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccueilpanierService } from '../services/accueilpanier.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit, OnDestroy {
  platsDansPanier: any[] = [];
  nombreArticles: number = 0;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private subscriptions: Subscription[] = [];
  showLoginPrompt: boolean = false;

  constructor(
    private panierService: AccueilpanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Forcer la synchronisation au démarrage
    this.panierService.forcerSynchronisation();
    
    // Charger le panier initial
    this.chargerPanier();
    
    // S'abonner aux observables
    this.subscriptions.push(
      this.panierService.panier$.subscribe(panier => {
        console.log('Panier mis à jour dans composant:', panier); // Debug
        this.platsDansPanier = [...panier]; // Créer une nouvelle référence
      }),
      
      this.panierService.nombreArticles$.subscribe(nombre => {
        console.log('Nombre articles mis à jour:', nombre); // Debug
        this.nombreArticles = nombre;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  chargerPanier(): void {
    // Utiliser les données du service plutôt que d'appeler getPanier()
    this.platsDansPanier = this.panierService.getPanier();
    console.log('Panier chargé:', this.platsDansPanier); // Debug
  }

  calculerSousTotal(plat: any): number {
    return plat.prix * plat.quantite;
  }

  calculerTotal(): number {
    return this.panierService.calculerTotal();
  }

  mettreAJourQuantite(index: number, nouvelleQuantite: number): void {
    if (nouvelleQuantite >= 1) {
      const success = this.panierService.mettreAJourQuantite(index, nouvelleQuantite);
      if (!success) {
        this.showErrorMessage('Impossible de modifier la quantité');
      }
    }
  }

  supprimerDuPanier(index: number): void {
    const success = this.panierService.supprimerDuPanier(index);
    if (success) {
      this.showSuccessMessage('Article supprimé du panier');
    } else {
      this.showErrorMessage('Impossible de supprimer l\'article');
    }
  }

  viderPanier(): void {
    this.panierService.clearPanier();
    this.showSuccessMessage('Panier vidé');
    
    // Forcer la mise à jour locale
    this.platsDansPanier = [];
    this.nombreArticles = 0;
  }

  commander(): void {
    if (this.platsDansPanier.length === 0) {
      this.showErrorMessage('Votre panier est vide');
      return;
    }

    // Afficher le message de confirmation personnalisé
    this.showLoginPrompt = true;
  }

  // Méthodes pour gérer la confirmation
  confirmerConnexion(): void {
    this.showLoginPrompt = false;
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/panier' } });
  }

  annulerConnexion(): void {
    this.showLoginPrompt = false;
  }

  // Méthode pour debug - à supprimer en production
  debugPanier(): void {
    console.log('=== DEBUG PANIER ===');
    console.log('Composant - platsDansPanier:', this.platsDansPanier);
    console.log('Composant - nombreArticles:', this.nombreArticles);
    console.log('Service - getPanier():', this.panierService.getPanier());
    console.log('LocalStorage:', localStorage.getItem('panier_user_' + this.panierService['authService'].getUserId()));
    console.log('===================');
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 3000);
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 3000);
  }

  get panierVide(): boolean {
    return this.platsDansPanier.length === 0;
  }
}