import { Component, OnInit, OnDestroy } from '@angular/core';
import { PanierService } from 'src/app/services/panier.service';
import { CommandeService } from 'src/app/services/commande.service';
import { PaymentService } from 'src/app/services/payment.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

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

  orderSuccess: boolean = false;
  orderError: string | null = null;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  showFactureModal: boolean = false;
  
  // Variables pour gérer le montant de commande en cours
  totalCommandeEnCours: number = 0;
  hasActiveOrder: boolean = false;
  idCommandeEnCours: number | null = null; // IMPORTANT: Stocker l'ID de commande
  
  // Variables pour le paiement
  isPaymentProcessing: boolean = false;
  paymentSuccess: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private panierService: PanierService,
    private commandeService: CommandeService,
    private paymentService: PaymentService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // S'abonner aux paramètres de route pour obtenir le numéro de table
    this.subscriptions.push(
      this.route.paramMap.subscribe(params => {
        const tableId = params.get('tableNumber');
        if (tableId) {
          this.tableNumber = parseInt(tableId);
          this.panierService.setTableNumber(this.tableNumber);
        } else {
          const storedTableNumber = localStorage.getItem('tableNumber');
          if (storedTableNumber) {
            this.tableNumber = parseInt(storedTableNumber);
            this.panierService.setTableNumber(this.tableNumber);
          }
        }
        
        this.chargerPanier();
        this.chargerCommandeEnCours();
      })
    );

    // S'abonner au nombre d'articles dans le panier
    this.subscriptions.push(
      this.panierService.nombreArticles$.subscribe(nombreArticles => {
        this.nombreArticles = nombreArticles;
      })
    );

    // S'abonner au total de commande en cours
    this.subscriptions.push(
      this.commandeService.getTotalCommandeObservable().subscribe(total => {
        this.totalCommandeEnCours = total;
        this.hasActiveOrder = total > 0;
      })
    );

    // Vérifier si on revient d'un paiement PayPal
    this.checkPaymentReturn();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkPaymentReturn(): void {
    // Vérifier les paramètres d'URL pour le retour PayPal
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

  private handlePaymentReturn(paymentId: string, payerId: string): void {
    if (!this.idCommandeEnCours) {
      // Récupérer l'ID de commande depuis le localStorage
      const storedCommandeId = localStorage.getItem(`idCommande_table_${this.tableNumber}`);
      if (storedCommandeId) {
        this.idCommandeEnCours = parseInt(storedCommandeId);
      } else {
        this.errorMessage = 'ID de commande non trouvé.';
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
          
          // Nettoyer la commande en cours après paiement réussi
          this.clearCommandeEnCours();
          
          // Rediriger après un délai
          setTimeout(() => {
            this.router.navigate(['/table', this.tableNumber]);
          }, 3000);
        } else {
          this.errorMessage = 'Le paiement n\'a pas pu être finalisé.';
        }
        
        this.clearMessagesDelayed();
      },
      error: (error) => {
        this.isPaymentProcessing = false;
        this.errorMessage = 'Erreur lors de la finalisation du paiement: ' + error;
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

  chargerCommandeEnCours(): void {
    // Vérifier s'il y a une commande en cours stockée
    const storedTotal = localStorage.getItem(`commandeEnCours_table_${this.tableNumber}`);
    const storedCommandeId = localStorage.getItem(`idCommande_table_${this.tableNumber}`);
    
    if (storedTotal && storedCommandeId) {
      this.totalCommandeEnCours = parseFloat(storedTotal);
      this.idCommandeEnCours = parseInt(storedCommandeId);
      this.hasActiveOrder = true;
      this.commandeService.setTotalCommandeEnCours(this.totalCommandeEnCours);
    }
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

  passerCommande(): void {
    this.clearMessages();

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
      quantite: plat.quantite
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

    // Sauvegarder le total AVANT de l'envoyer
    const totalCommande = this.calculerTotal();

    this.http.post<any>(
      `http://localhost:8081/commande/passerCommande/${this.tableNumber}`,
      platQuantites,
      { headers }
    ).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.orderSuccess = true;

        // IMPORTANT: Récupérer l'ID de commande depuis la réponse
        if (response && response.idCommande) {
          this.idCommandeEnCours = response.idCommande;
          
          // Stocker l'ID de commande et le total
          this.totalCommandeEnCours = totalCommande;
          this.hasActiveOrder = true;
          this.commandeService.setTotalCommandeEnCours(totalCommande);
          
          localStorage.setItem(`commandeEnCours_table_${this.tableNumber}`, totalCommande.toString());
          
          // Sauvegarder les détails pour référence
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

          // Vider le panier uniquement (garder le total de commande)
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
        
        // En cas d'erreur, supprimer la commande stockée
        this.clearCommandeEnCours();
        this.clearMessagesDelayed();
      }
    });
  }

procederAuPaiement(): void {
  this.clearMessages();

  if (!this.hasCommandeEnCours()) {
    this.errorMessage = 'Aucune commande à payer. Veuillez d\'abord passer une commande.';
    return;
  }

  if (!this.idCommandeEnCours) {
    this.errorMessage = 'ID de commande non trouvé.';
    return;
  }

  const montantTnd = this.getTotalAffiche();
  const montantUsd = this.paymentService.convertTndToUsd(montantTnd);
  
  console.log(`Paiement de ${montantTnd} TND (${montantUsd} USD)`);

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
      this.errorMessage = 'Erreur lors de la création du paiement';
    }
  });
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

  // Méthode pour nettoyer la commande en cours (après paiement par exemple)
  clearCommandeEnCours(): void {
    this.totalCommandeEnCours = 0;
    this.hasActiveOrder = false;
    this.idCommandeEnCours = null;
    this.commandeService.clearTotalCommande();
    localStorage.removeItem(`commandeEnCours_table_${this.tableNumber}`);
    localStorage.removeItem(`idCommande_table_${this.tableNumber}`);
    localStorage.removeItem(`detailsCommande_table_${this.tableNumber}`);
    localStorage.removeItem('pendingPayment');
  }

  // Méthode publique pour nettoyer après paiement réussi
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

  clearMessagesDelayed(): void {
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }
}