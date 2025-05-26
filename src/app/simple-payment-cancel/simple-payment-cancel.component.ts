import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { SimplePaymentService } from '../services/simple-payment.service';

@Component({
  selector: 'app-simple-payment-cancel',
  templateUrl: './simple-payment-cancel.component.html',
  styleUrls: ['./simple-payment-cancel.component.css']
})
export class SimplePaymentCancelComponent implements OnInit {
  idCommande: string | null = null;
  paymentDetails: any = null;
  showRetryOptions = false;
  isNavigating = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private simplePaymentService: SimplePaymentService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idCommande = params['idCommande'];
      console.log('Paiement annulé pour la commande:', this.idCommande);
    });

    this.paymentDetails = this.simplePaymentService.getPaymentDetails();
    this.showRetryOptions = !!this.paymentDetails;

    setTimeout(() => {
      if (!this.showRetryOptions && !this.isNavigating) {
        this.retournerAccueil();
      }
    }, 10000);
  }

  private safeNavigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate(commands, extras).catch(error => {
      console.error('Navigation failed:', error);
      // Fallback to home if navigation fails
      return this.router.navigate(['/client/accueilClient']);
    });
  }

  retournerAccueil(): void {
    if (this.isNavigating) return;
    this.isNavigating = true;
    this.simplePaymentService.clearPaymentDetails();
    
    this.safeNavigate(['/client/accueilClient'])
      .finally(() => this.isNavigating = false);
  }

  retournerAuPanier(): void {
    if (this.isNavigating) return;
    this.isNavigating = true;
    
    this.safeNavigate(['/client/pan'], {
      queryParams: { 
        retryPayment: true,
        commandeId: this.idCommande 
      }
    }).finally(() => this.isNavigating = false);
  }

  retenterPaiement(): void {
    if (this.isNavigating) return;
    this.isNavigating = true;
    
    if (this.paymentDetails?.idCommande) {
      this.safeNavigate(['/client/pan'], {
        queryParams: { 
          directPayment: true,
          commandeId: this.paymentDetails.idCommande,
          montant: this.paymentDetails.montantTotal
        }
      }).catch(() => this.retournerAuPanier())
        .finally(() => this.isNavigating = false);
    } else {
      this.retournerAuPanier();
    }
  }

  annulerDefinitivement(): void {
    if (this.isNavigating) return;
    
    if (confirm('Êtes-vous sûr de vouloir annuler définitivement cette commande ?')) {
      this.isNavigating = true;
      this.simplePaymentService.clearPaymentDetails();
      
      this.safeNavigate(['/client/accueilClient'], {
        queryParams: { 
          message: 'Commande annulée'
        }
      }).finally(() => this.isNavigating = false);
    }
  }

  continuerAchats(): void {
    if (this.isNavigating) return;
    this.retournerAccueil();
  }

  get montantCommande(): string {
    return this.paymentDetails?.montantTotal ? `${this.paymentDetails.montantTotal} TND` : '';
  }

  get numeroCommande(): string {
    if (this.idCommande) return `#${this.idCommande}`;
    if (this.paymentDetails?.idCommande) return `#${this.paymentDetails.idCommande}`;
    return 'N/A';
  }

  debugRoutes(): void {
    console.log('Current route:', this.router.url);
    console.log('Router config:', this.router.config);
    console.log('Navigation history:', this.router.getCurrentNavigation());
  }
}