import { Component, OnInit, OnDestroy } from '@angular/core';
import { PanierService } from 'src/app/services/panier.service';
import { CommandeService } from 'src/app/services/commande.service';
import { PaymentService } from 'src/app/services/payment.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-panier-passager',
  templateUrl: './panier-passager.component.html',
  styleUrls: ['./panier-passager.component.css']
})
export class PanierPassagerComponent implements OnInit, OnDestroy {
  platsDansPanier: any[] = [];
  couponCode: string = '';
  fraisLivraison: number = 0;
  codePromoApplique: boolean = false;
  remise: number = 0;
  nombreArticles: number = 0;
  tableNumber: number | null = null;
  isProcessing: boolean = false;
  showPaymentOptions = false;
  selectedPaymentMethod: 'especes' | 'paypal' | null = null;
  clientMessage: string = '';

  orderSuccess: boolean = false;
  orderError: string | null = null;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  showFactureModal: boolean = false;
  showDetailsCommande: boolean = false;

  // Variables pour gérer le montant de commande en cours
  totalCommandeEnCours: number = 0;
  hasActiveOrder: boolean = false;
  idCommandeEnCours: number | null = null;
  
  // Variables pour le paiement
  isPaymentProcessing: boolean = false;
  paymentSuccess: boolean = false;
  
  private subscriptions: Subscription[] = [];
  platsCommandeEnCours: any[] = [];

  constructor(
    private panierService: PanierService,
    private commandeService: CommandeService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  resetPanierEtCommande(): void {
    this.platsDansPanier = [];
    this.totalCommandeEnCours = 0;
    this.hasActiveOrder = false;
    this.idCommandeEnCours = null;
    this.platsCommandeEnCours = [];

    // Nettoyer localStorage pour la table en cours
    if (this.tableNumber) {
      localStorage.removeItem(`commandeEnCours_table_${this.tableNumber}`);
      localStorage.removeItem(`idCommande_table_${this.tableNumber}`);
      localStorage.removeItem(`detailsCommande_table_${this.tableNumber}`);
    }

    // Réinitialiser dans les services
    this.panierService.clearPanier();
    if (this.tableNumber !== null) {
  this.commandeService.setTotalCommandeEnCoursForTable(0, this.tableNumber);
}

    this.successMessage = 'Panier et commande réinitialisés.';
    this.clearMessagesDelayed();
  }

  isChatModalOpen = false;

  openChatModal(): void {
    this.isChatModalOpen = true;
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
  }

  ngOnInit(): void {
    // S'abonner aux paramètres de route pour obtenir le numéro de table
    this.subscriptions.push(
      this.route.paramMap.subscribe(params => {
        const tableId = params.get('tableNumber');
        if (tableId) {
          this.tableNumber = parseInt(tableId);
          this.panierService.setTableNumber(this.tableNumber);
          localStorage.setItem('tableNumber', this.tableNumber.toString());
        } else {
          const storedTableNumber = localStorage.getItem('tableNumber');
          if (storedTableNumber) {
            this.tableNumber = parseInt(storedTableNumber);
            this.panierService.setTableNumber(this.tableNumber);
          }
        }
        
        // IMPORTANT: Charger d'abord les données puis le panier
        this.loadCommandeData();
        this.chargerPanier();
      })
    );

    // S'abonner au nombre d'articles dans le panier
    this.subscriptions.push(
      this.panierService.nombreArticles$.subscribe(nombreArticles => {
        this.nombreArticles = nombreArticles;
      })
    );

    // CORRECTION PRINCIPALE: S'abonner au total de commande spécifique à cette table
    if (this.tableNumber !== null) {
  this.subscriptions.push(
    this.commandeService.getTotalCommandeObservable(this.tableNumber).subscribe(total => {
          if (total > 0) {
            this.totalCommandeEnCours = total;
            this.hasActiveOrder = true;
          } else {
            this.totalCommandeEnCours = 0;
            this.hasActiveOrder = false;
          }
        })
      );
    }

    // Vérifier si on revient d'un paiement PayPal
    this.checkPaymentReturn();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkPaymentReturn(): void {
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        if (params['paymentId'] && params['PayerID']) {
          this.handlePaymentReturn(params['paymentId'], params['PayerID']);
        } else if (params['cancelled']) {
          this.errorMessage = 'Paiement annulé.';
          this.clearMessagesDelayed();
        }
      })
    );
  }

  toggleDetailsCommande(): void {
    this.showDetailsCommande = !this.showDetailsCommande;
  }

  // Modifiez la méthode loadCommandeData pour charger aussi les plats
  private loadCommandeData(): void {
    if (this.tableNumber) {
      // Récupérer l'ID de commande depuis le localStorage
      const storedCommandeId = localStorage.getItem(`idCommande_table_${this.tableNumber}`);
      if (storedCommandeId) {
        this.idCommandeEnCours = parseInt(storedCommandeId);
        console.log('ID Commande chargé:', this.idCommandeEnCours);
      }

      // CORRECTION: Récupérer le montant total spécifique à cette table
      const storedTotal = localStorage.getItem(`commandeEnCours_table_${this.tableNumber}`);
      if (storedTotal) {
        this.totalCommandeEnCours = parseFloat(storedTotal);
        this.hasActiveOrder = true;
        
        // CORRECTION: Synchroniser avec le service pour cette table spécifique
        this.commandeService.setTotalCommandeEnCoursForTable(this.totalCommandeEnCours, this.tableNumber);
        console.log(`Total commande chargé pour table ${this.tableNumber}:`, this.totalCommandeEnCours);
      }

      // Récupérer les détails de la commande ET les plats
      const storedDetails = localStorage.getItem(`detailsCommande_table_${this.tableNumber}`);
      if (storedDetails) {
        try {
          const details = JSON.parse(storedDetails);
          // NOUVEAU: Charger les plats de la commande
          if (details.plats) {
            this.platsCommandeEnCours = details.plats;
          }
          console.log('Détails commande chargés:', details);
        } catch (e) {
          console.error('Erreur parsing commande details', e);
        }
      }
    }
  }

  // Nouvelle méthode pour obtenir le résumé des plats commandés
  getResumePlatsCommandes(): string {
    if (!this.platsCommandeEnCours || this.platsCommandeEnCours.length === 0) {
      return '';
    }
    
    return this.platsCommandeEnCours
      .map(plat => `${plat.nom} x${plat.quantite}`)
      .join(', ');
  }

  getNombreArticlesCommandes(): number {
    if (!this.platsCommandeEnCours || this.platsCommandeEnCours.length === 0) {
      return 0;
    }
    
    return this.platsCommandeEnCours.reduce((total, plat) => total + plat.quantite, 0);
  }

  private handlePaymentReturn(paymentId: string, payerId: string): void {
    // CORRECTION: Vérifier d'abord dans localStorage si pas en mémoire
    if (!this.idCommandeEnCours) {
      const storedCommandeId = localStorage.getItem(`idCommande_table_${this.tableNumber}`);
      if (storedCommandeId) {
        this.idCommandeEnCours = parseInt(storedCommandeId);
      } else {
        this.errorMessage = 'ID de commande non trouvé.';
        this.resetPaymentState();
        return;
      }
    }

    this.isPaymentProcessing = true;
    
    const executeRequest = {
      paymentId: paymentId,
      payerId: payerId,
      idCommande: this.idCommandeEnCours.toString()
    };

    this.paymentService.executePayment(executeRequest).subscribe({
      next: (response) => {
        this.isPaymentProcessing = false;
        
        if (response.status === 'success') {
          this.paymentSuccess = true;
          this.successMessage = 'Paiement effectué avec succès!';
          this.clearCommandeEnCours();
          
          setTimeout(() => {
            this.router.navigate(['/table', this.tableNumber]);
          }, 3000);
        } else {
          this.errorMessage = 'Le paiement n\'a pas pu être finalisé.';
          this.resetPaymentState();
        }
        
        this.clearMessagesDelayed();
      },
      error: (error) => {
        this.isPaymentProcessing = false;
        this.errorMessage = 'Erreur lors de la finalisation du paiement: ' + error;
        this.resetPaymentState();
        this.clearMessagesDelayed();
      }
    });
  }

  chargerPanier(): void {
    if (this.tableNumber) {
      this.platsDansPanier = this.panierService.getPanier();
      this.platsDansPanier.forEach(plat => {
        if (plat.quantite < 1) plat.quantite = 1;
      });
    }
  }

  // CORRECTION: Méthode publique pour recharger manuellement
  rechargeDonnees(): void {
    this.loadCommandeData();
    console.log('Données rechargées - hasActiveOrder:', this.hasActiveOrder, 'total:', this.totalCommandeEnCours);
  }

  // Obtenir le total à afficher (panier actuel ou commande en cours)
  getTotalAffiche(): number {
    if (this.hasActiveOrder && this.totalCommandeEnCours > 0) {
      return this.totalCommandeEnCours;
    }
    return this.calculerTotal();
  }

  // Vérifier s'il y a une commande en cours
  hasCommandeEnCours(): boolean {
    return this.hasActiveOrder && this.totalCommandeEnCours > 0 && this.idCommandeEnCours !== null;
  }

  // NOUVELLE MÉTHODE: Vérifier si on peut passer une nouvelle commande
  peutPasserNouvelleCommande(): boolean {
    return !this.hasCommandeEnCours();
  }

  // NOUVELLE MÉTHODE: Obtenir le message d'erreur pour commande bloquée
  getMessageCommandeBloquee(): string {
    if (this.hasCommandeEnCours()) {
      return `Vous avez déjà une commande en cours (n°${this.idCommandeEnCours}) d'un montant de ${this.totalCommandeEnCours.toFixed(2)} TND. Veuillez d'abord procéder au paiement avant de passer une nouvelle commande.`;
    }
    return '';
  }

  passerCommande(): void {
    this.clearMessages();

    // NOUVELLE VÉRIFICATION: Empêcher une nouvelle commande si une commande non payée existe
    if (!this.peutPasserNouvelleCommande()) {
      this.errorMessage = this.getMessageCommandeBloquee();
      this.clearMessagesDelayed();
      return;
    }

    if (!this.tableNumber) {
      this.errorMessage = 'Numéro de table non trouvé. Veuillez scanner à nouveau le QR code.';
      return;
    }

    if (this.platsDansPanier.length === 0) {
      this.errorMessage = 'Votre panier est vide. Veuillez ajouter des plats avant de commander.';
      return;
    }

    const sessionToken = localStorage.getItem('token');
    if (!sessionToken) {
      this.errorMessage = 'Session expirée. Veuillez scanner à nouveau le QR code.';
      return;
    }

    const platQuantites = this.platsDansPanier.map(plat => ({
      idPlat: plat.idPlat,
      quantite: plat.quantite,
      message: this.clientMessage
    }));

    if (platQuantites.some(p => !p.idPlat || p.quantite < 1)) {
      this.errorMessage = 'Certains plats sont invalides. Veuillez vérifier votre panier.';
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    });

    this.isProcessing = true;
    const totalCommande = this.calculerTotal();

    this.http.post<any>(
      `http://localhost:8081/commande/passerCommande/${this.tableNumber}`,
      platQuantites,
      { headers }
    ).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.orderSuccess = true;

        if (response && response.idCommande) {
          this.idCommandeEnCours = response.idCommande;
          this.totalCommandeEnCours = totalCommande;
          this.hasActiveOrder = true;
          
          // CORRECTION PRINCIPALE: Synchroniser avec le service pour cette table spécifique
         if (this.tableNumber !== null) {
  this.commandeService.setTotalCommandeEnCoursForTable(totalCommande, this.tableNumber);
}
          
          // Sauvegarder avec la clé correcte
          localStorage.setItem(`commandeEnCours_table_${this.tableNumber}`, totalCommande.toString());
          
          // Fixed line - add null check
          if (this.idCommandeEnCours !== null) {
            localStorage.setItem(`idCommande_table_${this.tableNumber}`, this.idCommandeEnCours.toString());
          }
          
          const commandeDetails = {
            idCommande: this.idCommandeEnCours,
            montantTotal: totalCommande,
            plats: this.platsDansPanier.map(plat => ({
              idPlat: plat.idPlat,
              nom: plat.name,
              quantite: plat.quantite,
              prix: plat.prix
            })),
            tableNumber: this.tableNumber,
            date: new Date()
          };
          localStorage.setItem(`detailsCommande_table_${this.tableNumber}`, JSON.stringify(commandeDetails));

          // NOUVEAU: Envoyer une notification à l'admin
          const nombrePlats = this.platsDansPanier.reduce((total, plat) => total + plat.quantite, 0);
          this.notificationService.addCommandeNotification(
            this.idCommandeEnCours,
            this.tableNumber,
            totalCommande,
            nombrePlats,
            this.platsDansPanier.map(plat => ({
              nom: plat.name,
              quantite: plat.quantite,
              prix: plat.prix
            })),
            this.clientMessage // Message optionnel du client
          );

          // Vider le panier uniquement
          this.panierService.clearPanier();
          this.platsDansPanier = [];

          this.successMessage = `Votre commande #${this.idCommandeEnCours} a été passée avec succès! Le montant reste disponible pour le paiement.`;
        } else {
          this.errorMessage = 'Erreur: ID de commande non reçu du serveur.';
        }
        
        this.clearMessagesDelayed();
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || 'Une erreur est survenue lors de la commande. Veuillez réessayer.';
        this.clearCommandeEnCours();
        this.clearMessagesDelayed();
      }
    });
  }

  procederAuPaiement(): void {
    this.clearMessages();
    this.resetPaymentState();

    // CORRECTION: Vérifications améliorées
    console.log('Procédure paiement - hasActiveOrder:', this.hasActiveOrder, 'total:', this.totalCommandeEnCours, 'id:', this.idCommandeEnCours);

    if (!this.hasCommandeEnCours()) {
      // Essayer de recharger les données avant d'échouer
      this.loadCommandeData();
      
      if (!this.hasCommandeEnCours()) {
        this.errorMessage = 'Aucune commande à payer. Veuillez d\'abord passer une commande.';
        return;
      }
    }

    this.showPaymentOptions = true;

    if (!this.idCommandeEnCours) {
      this.errorMessage = 'ID de commande non trouvé.';
      return;
    }

    const montantTnd = this.getTotalAffiche();
    const montantUsd = this.paymentService.convertTndToUsd(montantTnd);
    
    console.log(`Paiement de ${montantTnd} TND (${montantUsd} USD) pour commande ${this.idCommandeEnCours}`);

    this.isPaymentProcessing = true;

    this.paymentService.createPayment(this.idCommandeEnCours, montantTnd).subscribe({
      next: (response) => {
        this.isPaymentProcessing = false;
        
        if (response.status === 'success' && response.approvalUrl) {
          localStorage.setItem('pendingPayment', JSON.stringify({
            paymentId: response.paymentId,
            idCommande: this.idCommandeEnCours,
            tableNumber: this.tableNumber,
            amountTnd: montantTnd,
            amountUsd: montantUsd
          }));
          
          window.location.href = response.approvalUrl;
        } else {
          this.errorMessage = 'Erreur lors de la création du paiement';
        }
      },
      error: (error) => {
        this.isPaymentProcessing = false;
        this.errorMessage = 'Erreur lors de la création du paiement: ' + (error.error || error.message);
        console.error('Erreur paiement:', error);
      }
    });
  }

  // NOUVELLE MÉTHODE: Annuler la commande en cours (optionnel)
  annulerCommandeEnCours(): void {
    if (this.hasCommandeEnCours() && this.idCommandeEnCours) {
      // Appel API pour annuler la commande côté serveur (si disponible)
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'X-Session-Token': localStorage.getItem('token') || ''
      });

      this.http.delete(`http://localhost:8081/commande/annuler/${this.idCommandeEnCours}`, { headers })
        .subscribe({
          next: () => {
            this.clearCommandeEnCours();
            this.successMessage = 'Commande annulée avec succès. Vous pouvez maintenant passer une nouvelle commande.';
            this.clearMessagesDelayed();
          },
          error: (error) => {
            this.errorMessage = 'Erreur lors de l\'annulation de la commande: ' + (error.error?.message || error.message);
            this.clearMessagesDelayed();
          }
        });
    }
  }

  calculerSousTotal(plat: any): number {
    return plat.prix * plat.quantite;
  }

  calculerTotal(): number {
    const totalProduits = this.platsDansPanier.reduce(
      (total, plat) => total + this.calculerSousTotal(plat),
      0
    );
    return totalProduits + this.fraisLivraison - this.remise;
  }

  mettreAJourQuantite(index: number, nouvelleQuantite: number): void {
    if (nouvelleQuantite >= 1) {
      this.panierService.mettreAJourQuantite(index, nouvelleQuantite);
      this.platsDansPanier = this.panierService.getPanier();
    }
  }

  supprimerDuPanier(index: number): void {
    this.panierService.supprimerDuPanier(index);
    this.platsDansPanier = this.panierService.getPanier();
  }

  updatePanier(): void {
    this.successMessage = 'Panier mis à jour !';
    this.clearMessagesDelayed();
  }

  ouvrirFactureModal(): void {
    this.showFactureModal = true;
  }

  fermerFactureModal(): void {
    this.showFactureModal = false;
  }

  confirmerCommande(): void {
    this.fermerFactureModal();
    this.passerCommande();
  }

  clearCommandeEnCours(): void {
    this.totalCommandeEnCours = 0;
    this.hasActiveOrder = false;
    this.idCommandeEnCours = null;
    this.platsCommandeEnCours = [];
    this.showDetailsCommande = false;
    
    // CORRECTION: Utiliser la méthode spécifique à la table
    if (this.tableNumber !== null) {
  this.commandeService.clearTotalCommandeForTable(this.tableNumber);
}
    
    localStorage.removeItem('pendingPayment');
  }

  onPaiementReussi(): void {
    this.clearCommandeEnCours();
    this.paymentSuccess = true;
    this.successMessage = 'Paiement effectué avec succès!';
    this.clearMessagesDelayed();
  }

  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  resetPaymentState(): void {
    this.isPaymentProcessing = false;
    this.paymentSuccess = false;
    this.selectedPaymentMethod = null;
    localStorage.removeItem('pendingPayment');
  }

  clearMessagesDelayed(): void {
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }




}