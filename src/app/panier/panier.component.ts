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

  constructor(
    private panierService: AccueilpanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerPanier();
    
    this.subscriptions.push(
      this.panierService.panier$.subscribe(panier => {
        this.platsDansPanier = panier;
      }),
      
      this.panierService.nombreArticles$.subscribe(nombre => {
        this.nombreArticles = nombre;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  chargerPanier(): void {
    this.platsDansPanier = this.panierService.getPanier();
  }

  calculerSousTotal(plat: any): number {
    return plat.prix * plat.quantite;
  }

  calculerTotal(): number {
    return this.panierService.calculerTotal();
  }

  mettreAJourQuantite(index: number, nouvelleQuantite: number): void {
    if (nouvelleQuantite >= 1) {
      this.panierService.mettreAJourQuantite(index, nouvelleQuantite);
    }
  }

  supprimerDuPanier(index: number): void {
    this.panierService.supprimerDuPanier(index);
    this.showSuccessMessage('Article supprimé du panier');
  }

  viderPanier(): void {
    this.panierService.clearPanier();
    this.showSuccessMessage('Panier vidé');
  }

  commander(): void {
    if (this.platsDansPanier.length === 0) {
      this.showErrorMessage('Votre panier est vide');
      return;
    }

    if (confirm('Pour commander, vous devez avoir un compte. Voulez-vous vous connecter ?')) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/panier' } });
    }
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