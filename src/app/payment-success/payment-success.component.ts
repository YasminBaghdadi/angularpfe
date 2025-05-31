import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { CommandeService } from '../services/commande.service';
import { PanierService } from '../services/panier.service';
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
  commandeDetails: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private panierService : PanierService,
    private commandeService: CommandeService
  ) {}

  ngOnInit(): void {
    console.log('Initialisation PaymentSuccessComponent');
    
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['paymentId'];
      this.payerId = params['PayerID'] || params['PayerId'];
      this.idCommande = params['idCommande'];
      this.tableNumber = localStorage.getItem('tableNumber');

      // Récupérer les détails de la commande depuis le localStorage
      if (this.tableNumber) {
        const storedDetails = localStorage.getItem(`detailsCommande_table_${this.tableNumber}`);
        if (storedDetails) {
          this.commandeDetails = JSON.parse(storedDetails);
          this.montantPaye = this.commandeDetails.montantTotal + ' TND';
        }
      }

      console.log('Paramètres reçus:', {
        paymentId: this.paymentId,
        payerId: this.payerId,
        idCommande: this.idCommande,
        tableNumber: this.tableNumber,
        commandeDetails: this.commandeDetails
      });

      if (this.paymentId && this.payerId && this.idCommande) {
        this.executePayment();
      } else {
        this.handleMissingParameters();
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
          this.handlePaymentSuccess(response);
        } else {
          this.handlePaymentFailure(response);
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'exécution:', error);
        this.handlePaymentError(error);
      }
    });
  }

private handlePaymentSuccess(response: any): void {
    this.paymentSuccess = true;
    
    // Mettre à jour les données affichées
    if (response.amount) {
        this.montantPaye = response.amount + ' $';
    }

    // Nettoyage après succès
    this.cleanupAfterSuccess();

    // Redirection après 5 secondes
    setTimeout(() => {
        this.redirectAfterPayment();
    }, 5000);
}

private cleanupAfterSuccess(): void {
    if (this.tableNumber) {
        // Supprimer toutes les données locales liées à cette commande
        localStorage.removeItem(`commandeEnCours_table_${this.tableNumber}`);
        localStorage.removeItem(`idCommande_table_${this.tableNumber}`);
        localStorage.removeItem(`detailsCommande_table_${this.tableNumber}`);
        localStorage.removeItem('pendingPayment');
    }
    
    // Réinitialiser les états
    this.commandeService.clearToutCommande();
    this.panierService.clearPanier();
}

  private handlePaymentFailure(response: any): void {
    this.paymentError = true;
    this.errorMessage = response.message || 'Le paiement n\'a pas pu être finalisé';
    
    // Conserver la commande en cas d'échec
    if (this.tableNumber) {
      localStorage.setItem('payment_error', JSON.stringify({
        paymentId: this.paymentId,
        error: this.errorMessage
      }));
    }
  }

  private handlePaymentError(error: any): void {
    this.isProcessing = false;
    this.paymentError = true;
    this.errorMessage = error.error?.error || 'Erreur lors de la finalisation du paiement';
    console.error('Détails de l\'erreur:', error);
  }

  private handleMissingParameters(): void {
    this.isProcessing = false;
    this.paymentError = true;
    this.errorMessage = 'Paramètres de paiement manquants';
    console.error('Paramètres manquants:', {
      paymentId: this.paymentId,
      payerId: this.payerId,
      idCommande: this.idCommande
    });
  }

  

  private redirectAfterPayment(): void {
    if (this.tableNumber) {
      this.router.navigate(['/interface-table', this.tableNumber], {
        queryParams: { 
          paymentSuccess: true,
          commandeId: this.idCommande 
        }
      });
    } 
  }

  retournerAuPanier(): void {
    if (this.tableNumber) {
      this.router.navigate(['/panierPassager-table', this.tableNumber]);
    } 
  }

  retournerAccueil(): void {
    this.router.navigate(['/interface-table', this.tableNumber]);
  }

  imprimerFacture(): void {
    window.print();
  }
}