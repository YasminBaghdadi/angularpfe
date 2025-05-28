import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DashcommandeService } from 'src/app/services/dashcommande.service';
interface Plat {
    id: number;
    nom: string;
    prix: number;
}

interface DetailCommande {
    plat: Plat;
    quantite: number;
}


interface Commande {
    idCmnd: number;
    total: number;
    typeCommande: string;
    statutPaiement: string;
    dateCommande: string;
    details?: DetailCommande[];
    plats?: any[]; // Fallback if structure differs
}
@Component({
  selector: 'app-commandee',
  templateUrl: './commandee.component.html',
  styleUrls: ['./commandee.component.css']
})
export class CommandeeComponent implements OnInit {
  username: string | null = '';
  commandes: any[] = [];
  selectedType: string = 'SUR_PLACE';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedCommande: any = null;
  showModal: boolean = false;
  platQuantites: any[] = [];

  constructor(
    private authService: AuthService,
    private commandeService: DashcommandeService
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.loadCommandes();
  }

  loadCommandes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.commandeService.getCommandesByType(this.selectedType).subscribe({
      next: (response) => {
        this.commandes = Array.isArray(response) ? response : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des commandes';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  onTypeChange(): void {
    this.loadCommandes();
  }

openModificationModal(commande: any): void {
    this.selectedCommande = commande;
    this.showModal = true;

    console.log('🔍 Structure complète de la commande :', commande);
    
    // Try multiple possible structures for the plats
    if (commande.details && Array.isArray(commande.details)) {
        // Case 1: details array with plat objects
        this.platQuantites = commande.details
            .filter((detail: any) => detail && detail.plat)
            .map((detail: any) => ({
                idPlat: detail.plat.id,
                nom: detail.plat.nom,
                quantite: detail.quantite || 1,
                prix: detail.plat.prix || 0
            }));
    } else if (commande.plats && Array.isArray(commande.plats)) {
        // Case 2: direct plats array
        this.platQuantites = commande.plats.map((plat: any) => ({
            idPlat: plat.id || plat.idPlat,
            nom: plat.nom,
            quantite: plat.quantite || 1,
            prix: plat.prix || 0
        }));
    } else if (commande.detailCommandes && Array.isArray(commande.detailCommandes)) {
        // Case 3: detailCommandes array (alternative naming)
        this.platQuantites = commande.detailCommandes
            .filter((detail: any) => detail && detail.plat)
            .map((detail: any) => ({
                idPlat: detail.plat.id,
                nom: detail.plat.nom,
                quantite: detail.quantite || 1,
                prix: detail.plat.prix || 0
            }));
    } else {
        // Final fallback - try to parse from whatever structure exists
        this.platQuantites = [];
        if (commande.platQuantites) {
            this.platQuantites = [...commande.platQuantites];
        }
        console.warn('⚠️ Using fallback plat extraction', this.platQuantites);
    }

    if (this.platQuantites.length === 0) {
        console.error('❌ No plats found in command structure', commande);
    } else {
        console.log('✅ Plats extracted:', this.platQuantites);
    }
}

  closeModal(): void {
    this.showModal = false;
    this.selectedCommande = null;
  }

  modifierCommande(): void {
    if (!this.selectedCommande) return;

    // Préparer les données au format attendu par le backend (PlatQuantite[])
    const platQuantitesForBackend = this.platQuantites
      .filter(plat => plat.idPlat && plat.quantite > 0) // Filtrer les plats valides
      .map(plat => ({
        idPlat: plat.idPlat,
        quantite: parseInt(plat.quantite.toString()) // Assurer que c'est un nombre
      }));

    console.log('📤 Données envoyées au backend :', platQuantitesForBackend);

    if (platQuantitesForBackend.length === 0) {
      this.errorMessage = 'Aucun plat valide à modifier';
      return;
    }

    this.isLoading = true;
    this.commandeService.modifierCommande(this.selectedCommande.idCmnd, platQuantitesForBackend)
      .subscribe({
        next: (response) => {
          this.successMessage = response;
          this.loadCommandes();
          this.closeModal();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la modification: ' + (err.error || err.message);
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
  }

  confirmDelete(idCmnd: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      this.supprimerCommande(idCmnd);
    }
  }

  supprimerCommande(idCmnd: number): void {
    this.isLoading = true;
    this.commandeService.supprimerCommande(idCmnd).subscribe({
      next: (response) => {
        this.successMessage = response;
        this.loadCommandes();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la suppression: ' + (err.error || err.message);
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }

  updateQuantite(plat: any, event: any): void {
    const newQuantite = parseInt(event.target.value);
    if (newQuantite >= 0) {
      plat.quantite = newQuantite;
    }
  }

  // Méthode utilitaire pour supprimer un plat de la liste
  supprimerPlat(index: number): void {
    this.platQuantites.splice(index, 1);
  }



  createSimpleCommande(): void {
  // Exemple de données minimales - à adapter avec vos inputs
  const platQuantites = [
    {idPlat: 1, quantite: 2}, // Plat ID 1, quantité 2
    {idPlat: 3, quantite: 1}  // Plat ID 3, quantité 1
  ];

  this.isLoading = true;
  this.commandeService.createSimpleCommande(platQuantites).subscribe({
    next: (response) => {
      console.log('Commande créée:', response);
      this.loadCommandes(); // Recharger la liste
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur:', err);
      this.isLoading = false;
    }
  });
}
}