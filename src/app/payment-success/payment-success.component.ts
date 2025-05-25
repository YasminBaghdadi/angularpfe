import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  isProcessing = true;
  paymentSuccess = false;
  paymentError = false;
  errorMessage = '';

  paymentId = '';
  payerId = '';
  idCommande = '';
  tableNumber: string | null = null;
  montantPaye = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    console.log('Initialisation PaymentSuccessComponent');
    
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['paymentId'];
      this.payerId = params['PayerID'] || params['PayerId'];
      this.idCommande = params['idCommande'];
      this.tableNumber = localStorage.getItem('tableNumber');

      console.log('Paramètres reçus:', {
        paymentId: this.paymentId,
        payerId: this.payerId,
        idCommande: this.idCommande,
        tableNumber: this.tableNumber
      });

      if (this.paymentId && this.payerId && this.idCommande) {
        this.executePayment();
      } else {
        this.isProcessing = false;
        this.paymentError = true;
        this.errorMessage = 'Paramètres de paiement manquants';
        console.error('Paramètres manquants:', params);
      }
    });
  }

  executePayment(): void {
    console.log('Exécution du paiement...');
    
    const executeRequest = {
      paymentId: this.paymentId,
      payerId: this.payerId,
      idCommande: this.idCommande
    };

    this.paymentService.executePayment(executeRequest).subscribe({
      next: (response) => {
        console.log('Réponse du serveur:', response);
        this.isProcessing = false;

        if (response.status === 'success') {
          this.paymentSuccess = true;
          this.montantPaye = response.amount || '';

          // Nettoyage après succès
          this.cleanupAfterSuccess();

          // Redirection après 5 secondes
          setTimeout(() => {
            this.redirectAfterPayment();
          }, 5000);
        } else {
          this.paymentError = true;
          this.errorMessage = response.message || 'Le paiement n\'a pas pu être finalisé';
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'exécution:', error);
        this.isProcessing = false;
        this.paymentError = true;
        this.errorMessage = error.error?.error || 'Erreur lors de la finalisation du paiement';
      }
    });
  }

  private cleanupAfterSuccess(): void {
    if (this.tableNumber) {
      localStorage.removeItem(`commandeEnCours_table_${this.tableNumber}`);
      localStorage.removeItem(`idCommande_table_${this.tableNumber}`);
      localStorage.removeItem(`detailsCommande_table_${this.tableNumber}`);
      localStorage.removeItem('pendingPayment');
    }
  }

  private redirectAfterPayment(): void {
    if (this.tableNumber) {
      this.router.navigate(['/interface-table', this.tableNumber]);
    } else {
      this.router.navigate(['/accueil']);
    }
  }

  retournerAuPanier(): void {
    if (this.tableNumber) {
      this.router.navigate(['/panierPassager-table', this.tableNumber]);
    }
  }

  retournerAccueil(): void {
    this.router.navigate(['/accueil']);
  }
}