import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { SimplePaymentService } from '../services/simple-payment.service';
import { CommandeService } from '../services/commande.service';
import { PanierService } from '../services/panier.service';

@Component({
  selector: 'app-simple-payment-success',
  templateUrl: './simple-payment-success.component.html',
  styleUrls: ['./simple-payment-success.component.css']
})
export class SimplePaymentSuccessComponent implements OnInit {
  isProcessing = true;
  paymentSuccess = false;
  paymentError = false;
  errorMessage = '';

  paymentId = '';
  payerId = '';
  idCommande = '';
  montantPaye = '';
  commandeDetails: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private simplePaymentService: SimplePaymentService,
    private panierService: PanierService,
    private commandeService: CommandeService
  ) {}

  private safeNavigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate(commands, extras).catch(error => {
      console.error('Navigation failed:', error);
      return this.router.navigate(['/client/accueilClient']);
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['paymentId'];
      this.payerId = params['PayerID'] || params['PayerId'];
      this.idCommande = params['idCommande'];

      const savedPaymentDetails = this.simplePaymentService.getPaymentDetails();
      if (savedPaymentDetails) {
        this.commandeDetails = savedPaymentDetails.commandeDetails;
        this.montantPaye = savedPaymentDetails.montantTotal + ' TND';
      }

      if (this.paymentId && this.payerId && this.idCommande) {
        this.executePayment();
      } else {
        this.handleMissingParameters();
      }
    });
  }

  executePayment(): void {
    const executeRequest = {
      paymentId: this.paymentId,
      payerId: this.payerId,
      idCommande: this.idCommande
    };

    this.simplePaymentService.executeSimplePayment(executeRequest).subscribe({
      next: (response) => {
        this.isProcessing = false;
        if (response.status === 'success') {
          this.handlePaymentSuccess(response);
        } else {
          this.handlePaymentFailure(response);
        }
      },
      error: (error) => {
        this.handlePaymentError(error);
      }
    });
  }

  private handlePaymentSuccess(response: any): void {
    this.paymentSuccess = true;
    if (response.amount) {
      this.montantPaye = response.amount + ' €';
    }
    this.cleanupAfterSuccess();

    setTimeout(() => {
      this.redirectToAccueil();
    }, 5000);
  }

  private cleanupAfterSuccess(): void {
    this.simplePaymentService.clearPaymentDetails();
    this.commandeService.clearToutCommande();
    this.panierService.clearPanier();
  }

  private redirectToAccueil(): void {
    this.safeNavigate(['/client/accueilClient'], {
      queryParams: { 
        paymentSuccess: true,
        commandeId: this.idCommande 
      }
    });
  }

  private handlePaymentFailure(response: any): void {
    this.isProcessing = false;
    this.paymentError = true;
    this.errorMessage = response.message || 'Le paiement n\'a pas pu être finalisé';
    this.simplePaymentService.savePaymentError(this.paymentId, this.errorMessage);
  }

  private handlePaymentError(error: any): void {
    this.isProcessing = false;
    this.paymentError = true;
    this.errorMessage = error.error?.error || 'Erreur lors de la finalisation du paiement';
    this.simplePaymentService.savePaymentError(this.paymentId, this.errorMessage);
  }

  private handleMissingParameters(): void {
    this.isProcessing = false;
    this.paymentError = true;
    this.errorMessage = 'Paramètres de paiement manquants';
  }

  retournerAccueil(): void {
    this.safeNavigate(['/client/accueilClient']);
  }

  retournerAuPanier(): void {
    this.safeNavigate(['/client/pan']);
  }

  nouvelleCommande(): void {
    this.cleanupAfterSuccess();
    this.safeNavigate(['/client/pan']);
  }

  imprimerFacture(): void {
    window.print();
  }

  retenterPaiement(): void {
    if (this.idCommande) {
      this.safeNavigate(['/client/pan'], {
        queryParams: { 
          retryPayment: true,
          commandeId: this.idCommande 
        }
      });
    }
  }
}