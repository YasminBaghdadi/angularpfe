
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  templateUrl: './payment-cancel.component.html',
  styleUrls: ['./payment-cancel.component.css']
})
export class PaymentCancelComponent implements OnInit {
  idCommande: string | null = null;
  tableNumber: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idCommande = params['idCommande'];
      
      // Récupérer le numéro de table depuis le localStorage
      this.tableNumber = localStorage.getItem('tableNumber');
      
      console.log('Paiement annulé pour la commande:', this.idCommande);
      console.log('Numéro de table:', this.tableNumber);
    });

    // Redirection automatique après 10 secondes vers le panier
    setTimeout(() => {
      if (this.tableNumber) {
        this.router.navigate(['/panierPassager-table', this.tableNumber]);
      } else {
        this.router.navigate(['/accueil']);
      }
    }, 10000);
  }

  retournerAuPanier(): void {
    if (this.tableNumber) {
      this.router.navigate(['/panierPassager-table', this.tableNumber]);
    } else {
      this.router.navigate(['/panier']);
    }
  }

  retournerInterface(): void {
    if (this.tableNumber) {
      this.router.navigate(['/interface-table', this.tableNumber]);
    } else {
      this.router.navigate(['/accueil']);  
    }
  }

  retournerAccueil(): void {
    this.router.navigate(['/accueil']);
  }
}