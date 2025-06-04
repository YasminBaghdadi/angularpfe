import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service';
import { AuthService } from 'src/app/services/auth.service';
import { CommandeService } from 'src/app/services/commande.service';
import { SimplePaymentService } from 'src/app/services/simple-payment.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pan',
  templateUrl: './pan.component.html',
  styleUrls: ['./pan.component.css']
})
export class PanComponent implements OnInit, OnDestroy {
  nombreArticles: number = 0;
  panier: any[] = [];
  sousTotal: number = 0;
  fraisLivraison: number = 0;
  total: number = 0;
  username: string | null = '';
  adresseLivraison: string = '';
  telephone: string = '';
  instructionsClient: string = ''; // Nouvelle propriété pour les instructions
  isProcessing: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showFactureModal: boolean = false;
  
  // Propriétés pour gérer l'état de la commande
  commandePassee: boolean = false;
  commandeEnAttente: any = null;
  panierBloque: boolean = false;

  // Gestion des subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private panierService: AccueilpanierService,
    private authService: AuthService,
    private commandeService: CommandeService,
    private simplePaymentService: SimplePaymentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  isChatModalOpen = false;
  openChatModal(): void {
    this.isChatModalOpen = true;
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
  }

  ngOnInit(): void {
    this.fraisLivraison = this.panierService.getFraisLivraison();
    this.verifierParametresRetour();
    this.verifierCommandeEnAttente();
    this.verifierPaiementEnCours();
    this.setupSubscriptions();
    
    this.username = localStorage.getItem('username');
  }

  ngOnDestroy(): void {
    // Nettoyer les subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions(): void {
    // Subscription pour le nombre d'articles
    const nombreSub = this.panierService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });
    this.subscriptions.push(nombreSub);

    // Subscription pour le panier
    const panierSub = this.panierService.panier$.subscribe(panier => {
      this.panier = panier;
      if (!this.commandePassee) {
        this.sousTotal = this.panierService.calculerSousTotal();
        this.total = this.panierService.calculerTotal();
      }
    });
    this.subscriptions.push(panierSub);

    // Subscription pour l'état de blocage du panier
    const bloqueSub = this.panierService.panierBloque$.subscribe(bloque => {
      this.panierBloque = bloque;
      console.log('État panier bloqué:', bloque);
    });
    this.subscriptions.push(bloqueSub);

    // Subscription pour le total de commande
    const totalSub = this.commandeService.getTotalCommandeObservable().subscribe(totalCommande => {
      if (totalCommande > 0) {
        this.total = totalCommande;
        this.commandePassee = true;
      }
    });
    this.subscriptions.push(totalSub);
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
        this.instructionsClient = this.commandeEnAttente.instructions || ''; // Charger les instructions existantes
        this.sousTotal = this.commandeEnAttente.sousTotal || 0;
        this.fraisLivraison = this.commandeEnAttente.fraisLivraison || this.panierService.getFraisLivraison();
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
    if (this.panierBloque || this.commandePassee) {
      this.errorMessage = 'Impossible de modifier le panier : une commande est en attente de paiement.';
      this.clearMessagesAfterDelay();
      return;
    }

    const success = this.panierService.mettreAJourQuantite(index, nouvelleQuantite);
    if (!success) {
      this.errorMessage = 'Impossible de modifier la quantité.';
      this.clearMessagesAfterDelay();
    }
  }

  supprimerPlat(index: number): void {
    if (this.panierBloque || this.commandePassee) {
      this.errorMessage = 'Impossible de modifier le panier : une commande est en attente de paiement.';
      this.clearMessagesAfterDelay();
      return;
    }

    const success = this.panierService.supprimerDuPanier(index);
    if (!success) {
      this.errorMessage = 'Impossible de supprimer le plat.';
      this.clearMessagesAfterDelay();
    }
  }

  ouvrirFactureModal(): void {
    if (this.panierBloque && !this.peutPasserNouvelleCommande()) {
      this.errorMessage = 'Une commande est déjà en attente de paiement. Veuillez d\'abord payer ou annuler la commande actuelle.';
      this.clearMessagesAfterDelay();
      return;
    }

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
    if (!this.peutPasserNouvelleCommande()) {
      this.errorMessage = 'Une commande est déjà en attente de paiement.';
      this.clearMessagesAfterDelay();
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const infoLivraison = {
        adresse: this.adresseLivraison,
        telephone: this.telephone,
        instructions: this.instructionsClient // Inclure les instructions dans les données de commande
      };

      const response = await this.panierService.passerCommandeLivraison(infoLivraison);
      
      this.commandePassee = true;
      this.commandeEnAttente = this.commandeService.getCommandeEnAttente();
      
      this.successMessage = `Commande #${response.idCmnd} passée avec succès! Procédez au paiement.`;
      this.clearMessagesAfterDelay();
      
      this.fermerFactureModal();
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.errorMessage = error.message;
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
    if (confirm('Êtes-vous sûr de vouloir annuler votre commande ? Cela vous permettra de passer une nouvelle commande.')) {
      // Utiliser la nouvelle méthode du service
      this.panierService.annulerCommandeEnAttente();
      this.simplePaymentService.clearPaymentDetails();
      
      this.commandePassee = false;
      this.commandeEnAttente = null;
      this.adresseLivraison = '';
      this.telephone = '';
      this.instructionsClient = ''; // Réinitialiser les instructions
      this.sousTotal = this.panierService.calculerSousTotal();
      this.total = this.panierService.calculerTotal();
      this.successMessage = 'Commande annulée. Vous pouvez maintenant passer une nouvelle commande.';
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

  // Méthode pour vérifier si on peut passer une nouvelle commande
  peutPasserNouvelleCommande(): boolean {
    return this.panierService.peutPasserCommande();
  }

  // Nouvelle méthode pour compter les caractères des instructions
  get instructionsRestants(): number {
    const maxLength = 500; // Limite de caractères
    return maxLength - this.instructionsClient.length;
  }

  // Méthode pour vérifier si les instructions sont trop longues
  get instructionsTropLongues(): boolean {
    return this.instructionsClient.length > 500;
  }

  get texteBoutonPrincipal(): string {
    if (this.commandePassee) {
      return this.isProcessing ? 'INITIALISATION DU PAIEMENT...' : 'PAYER AVEC PAYPAL';
    }
    return this.isProcessing ? 'TRAITEMENT...' : 'PASSER À LA CAISSE';
  }

  get peutModifierPanier(): boolean {
    return !this.commandePassee && !this.panierBloque;
  }

  get platsAffichage(): any[] {
    if (this.commandePassee && this.commandeEnAttente) {
      return this.commandeEnAttente.plats;
    }
    return this.panier;
  }

  get montantSousTotalTND(): string {
    return `${this.sousTotal.toFixed(2)} TND`;
  }

  get montantFraisLivraisonTND(): string {
    return `${this.fraisLivraison.toFixed(2)} TND`;
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

  get messageEtatPanier(): string {
    if (this.panierBloque && this.commandeEnAttente) {
      return `Commande #${this.commandeEnAttente.id} en attente de paiement. Payez ou annulez pour passer une nouvelle commande.`;
    }
    return '';
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