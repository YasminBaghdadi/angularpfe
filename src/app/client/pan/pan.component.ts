import { Component, OnInit } from '@angular/core';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service';
import { AuthService } from 'src/app/services/auth.service';
import { CommandeService } from 'src/app/services/commande.service';
import { SimplePaymentService } from 'src/app/services/simple-payment.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-pan',
  templateUrl: './pan.component.html',
  styleUrls: ['./pan.component.css']
})
export class PanComponent implements OnInit {
  nombreArticles: number = 0;
  panier: any[] = [];
  total: number = 0;
  username: string | null = '';
  adresseLivraison: string = '';
  telephone: string = '';
  isProcessing: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showFactureModal: boolean = false;
  
  // Propriétés pour gérer l'état de la commande
  commandePassee: boolean = false;
  commandeEnAttente: any = null;

  constructor(
    private panierService: AccueilpanierService,
    private authService: AuthService,
    private commandeService: CommandeService,
    private simplePaymentService: SimplePaymentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}// Dans PanComponent, ajoutez ceci dans ngOnInit() :


  ngOnInit(): void {
    this.verifierParametresRetour();
    this.verifierCommandeEnAttente();
    this.verifierPaiementEnCours();
  console.log('Panier:', this.panier);
  console.log('Commande en attente:', this.commandeEnAttente?.plats);
  
    this.panierService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });

    this.panierService.panier$.subscribe(panier => {
      this.panier = panier;
      if (!this.commandePassee) {
        this.total = this.panierService.calculerTotal();
      }
    });

    this.commandeService.getTotalCommandeObservable().subscribe(totalCommande => {
      if (totalCommande > 0) {
        this.total = totalCommande;
        this.commandePassee = true;
      }
    });

    this.username = localStorage.getItem('username');
  }

  private verifierParametresRetour(): void {
    this.route.queryParams.subscribe(params => {
      if (params['retryPayment']) {
        this.successMessage = 'Vous pouvez réessayer le paiement ou modifier votre commande.';
        this.clearMessagesAfterDelay();
      }
      
      if (params['directPayment'] && params['commandeId']) {
        this.commandePassee = true;
        this.total = parseFloat(params['montant']) || this.total;
        this.successMessage = 'Reprise du processus de paiement...';
        this.clearMessagesAfterDelay();
      }
    });
  }

  private verifierCommandeEnAttente(): void {
    this.commandeEnAttente = this.commandeService.getCommandeEnAttente();
    const totalEnCours = this.commandeService.getTotalCommandeEnCours();
    
    if (this.commandeEnAttente || totalEnCours > 0) {
      this.commandePassee = true;
      this.total = totalEnCours > 0 ? totalEnCours : this.commandeEnAttente?.montantTotal || 0;
      
      if (this.commandeEnAttente) {
        this.adresseLivraison = this.commandeEnAttente.adresse || '';
        this.telephone = this.commandeEnAttente.telephone || '';
      }
    }
  }

  private verifierPaiementEnCours(): void {
    const pendingPayment = this.simplePaymentService.getPaymentDetails();
    if (pendingPayment) {
      this.successMessage = 'Un paiement est en cours. Si vous revenez de PayPal, le traitement est en cours...';
      this.clearMessagesAfterDelay();
    }

    const paymentError = this.simplePaymentService.getPaymentError();
    if (paymentError) {
      this.errorMessage = `Erreur de paiement: ${paymentError.error}`;
      this.clearMessagesAfterDelay();
    }
  }

  modifierQuantite(index: number, nouvelleQuantite: number): void {
    if (this.commandePassee) {
      this.errorMessage = 'Impossible de modifier le panier, commande déjà passée. Veuillez procéder au paiement.';
      this.clearMessagesAfterDelay();
      return;
    }
    this.panierService.mettreAJourQuantite(index, nouvelleQuantite);
  }

  supprimerPlat(index: number): void {
    if (this.commandePassee) {
      this.errorMessage = 'Impossible de modifier le panier, commande déjà passée. Veuillez procéder au paiement.';
      this.clearMessagesAfterDelay();
      return;
    }
    this.panierService.supprimerDuPanier(index);
  }

  ouvrirFactureModal(): void {
    if (!this.adresseLivraison || !this.telephone) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      this.clearMessagesAfterDelay();
      return;
    }
    
    if (this.panier.length === 0) {
      this.errorMessage = 'Votre panier est vide';
      this.clearMessagesAfterDelay();
      return;
    }
    
    this.showFactureModal = true;
  }

  fermerFactureModal(): void {
    this.showFactureModal = false;
  }

  async confirmerCommande(): Promise<void> {
    this.isProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const infoLivraison = {
        adresse: this.adresseLivraison,
        telephone: this.telephone
      };

      const response = await this.panierService.passerCommandeLivraison(infoLivraison);
      
      this.commandePassee = true;
      this.commandeEnAttente = this.commandeService.getCommandeEnAttente();
      
      this.successMessage = `Commande #${response.idCmnd} passée avec succès! Vous pouvez maintenant procéder au paiement.`;
      this.clearMessagesAfterDelay();
      
      this.fermerFactureModal();
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.errorMessage = error.message;
      } else if (typeof error === 'string') {
        this.errorMessage = error;
      } else {
        this.errorMessage = 'Erreur lors de la commande';
      }
      this.clearMessagesAfterDelay();
    } finally {
      this.isProcessing = false;
    }
  }

  procederAuPaiementSimple(): void {
    if (!this.commandeEnAttente || !this.commandeEnAttente.id) {
      this.errorMessage = 'Aucune commande en attente trouvée';
      this.clearMessagesAfterDelay();
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;

    this.simplePaymentService.createSimplePayment(this.commandeEnAttente.id, this.total).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.approvalUrl) {
          this.simplePaymentService.savePaymentDetails(
            response.paymentId,
            this.commandeEnAttente.id,
            this.total,
            this.commandeEnAttente
          );
          
          window.location.href = response.approvalUrl;
        } else {
          this.errorMessage = 'Erreur lors de la création du paiement PayPal';
          this.isProcessing = false;
        }
      },
      error: (error) => {
        this.simplePaymentService.savePaymentError(
          'unknown', 
          error.error || 'Erreur lors de l\'initialisation du paiement'
        );
        
        this.errorMessage = error.error || 'Erreur lors de l\'initialisation du paiement';
        this.isProcessing = false;
        this.clearMessagesAfterDelay();
      }
    });
  }

  annulerCommande(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler votre commande ?')) {
      this.commandeService.clearToutCommande();
      this.simplePaymentService.clearPaymentDetails();
      
      this.commandePassee = false;
      this.commandeEnAttente = null;
      this.adresseLivraison = '';
      this.telephone = '';
      this.total = this.panierService.calculerTotal();
      this.successMessage = 'Commande annulée. Vous pouvez modifier votre panier.';
      this.clearMessagesAfterDelay();
    }
  }

  retenterPaiement(): void {
    if (this.commandeEnAttente && this.commandeEnAttente.id) {
      this.simplePaymentService.clearPaymentDetails();
      this.errorMessage = null;
      this.procederAuPaiementSimple();
    } else {
      this.errorMessage = 'Impossible de réessayer le paiement, commande non trouvée';
      this.clearMessagesAfterDelay();
    }
  }

  get texteBoutonPrincipal(): string {
    if (this.commandePassee) {
      return this.isProcessing ? 'INITIALISATION DU PAIEMENT...' : 'PAYER AVEC PAYPAL';
    }
    return this.isProcessing ? 'TRAITEMENT...' : 'PASSER À LA CAISSE';
  }

  get peutModifierPanier(): boolean {
    return !this.commandePassee;
  }

  get platsAffichage(): any[] {
    if (this.commandePassee && this.commandeEnAttente) {
      return this.commandeEnAttente.plats;
    }
    return this.panier;
  }

  get montantTotalTND(): string {
    return `${this.total.toFixed(2)} TND`;
  }

  get montantTotalUSD(): string {
    const montantUSD = this.simplePaymentService.convertTndToUsd(this.total);
    return `${montantUSD} USD`;
  }

  get hasPaymentError(): boolean {
    const paymentError = this.simplePaymentService.getPaymentError();
    return paymentError !== null;
  }

  get paymentErrorMessage(): string {
    const paymentError = this.simplePaymentService.getPaymentError();
    return paymentError ? paymentError.error : '';
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.errorMessage = null;
      this.successMessage = null;
    }, 5000);
  }

  onLogout(): void {
    this.simplePaymentService.clearPaymentDetails();
    this.authService.logout();
  }
}