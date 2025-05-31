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
    plats?: any[];
}

interface AdminCommandeRequest {
    typeCommande: string; 
    platQuantites: { idPlat: number; quantite: number }[]; 
    userId?: number;  
    username?: string; 
    adresse?: string; 
    telephone?: string; 
    tableNumber?: number; 
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
  showDeleteModal: boolean = false;
idCommandeToDelete: number | null = null;
  
  // Nouveau: Statut de paiement sélectionné
  selectedStatutPaiement: string = '';
  
  // Liste des statuts de paiement disponibles
  statutsPaiement = [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'PAYER_EN_LIGNE', label: 'Payé en ligne' },
    { value: 'PAYER_ESPECE', label: 'Payé en espèces' }
  ];

  // Nouvelles propriétés pour la création de commande admin
  adminCommandeForm: AdminCommandeRequest = {
    typeCommande: 'SUR_PLACE',
    platQuantites: [],
    username: ''
  };
  adminPlatQuantites: any[] = [];
  availablePlats: any[] = []; // À remplir avec la liste des plats disponibles

  constructor(
    private authService: AuthService,
    private commandeService: DashcommandeService
  ) {}
openDeleteModal(idCmnd: number): void {
  this.idCommandeToDelete = idCmnd;
  this.showDeleteModal = true;
}

closeDeleteModal(): void {
  this.idCommandeToDelete = null;
  this.showDeleteModal = false;
}

confirmDeleteCommande(): void {
  if (this.idCommandeToDelete !== null) {
    this.supprimerCommande(this.idCommandeToDelete);
    this.closeDeleteModal();
  }
}
  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.loadCommandes();
    // this.loadAvailablePlats(); // Décommentez si vous avez une méthode pour charger les plats
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
    this.isLoading = true;
    
    // Initialiser le statut de paiement sélectionné avec la valeur actuelle
    this.selectedStatutPaiement = commande.statutPaiement || 'EN_ATTENTE';

    console.log('🔍 Structure complète de la commande :', commande);
    
    if (!commande.details || commande.details.length === 0) {
        console.log('📡 Récupération des détails de la commande...');
        
        this.commandeService.getCommande(commande.idCmnd).subscribe({
            next: (commandeDetails) => {
                console.log('✅ Détails reçus:', commandeDetails);
                this.extractPlatsFromCommande(commandeDetails);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('❌ Erreur lors de la récupération des détails:', err);
                this.errorMessage = 'Impossible de récupérer les détails de la commande';
                this.isLoading = false;
            }
        });
    } else {
        this.extractPlatsFromCommande(commande);
        this.isLoading = false;
    }
  }

  private extractPlatsFromCommande(commande: any): void {
    this.platQuantites = [];
    
    // Créer un objet temporaire pour regrouper les plats par id
    const platsGroupes: {[key: number]: any} = {};

    if (commande.details && Array.isArray(commande.details)) {
        commande.details.forEach((detail: any) => {
            const idPlat = detail.idPlat || detail.plat?.idPlat || detail.plat?.id;
            if (idPlat) {
                if (!platsGroupes[idPlat]) {
                    platsGroupes[idPlat] = {
                        idPlat: idPlat,
                        nom: detail.nomPlat || detail.plat?.name || detail.plat?.nom,
                        quantite: 0,
                        prix: detail.prix || detail.plat?.prix || 0
                    };
                }
                platsGroupes[idPlat].quantite = detail.quantite || 1;
            }
        });
    } else if (commande.plats && Array.isArray(commande.plats)) {
        commande.plats.forEach((plat: any) => {
            const idPlat = plat.platId || plat.idPlat || plat.id;
            if (idPlat) {
                if (!platsGroupes[idPlat]) {
                    platsGroupes[idPlat] = {
                        idPlat: idPlat,
                        nom: plat.platName || plat.nom || plat.name,
                        quantite: 0,
                        prix: plat.prixUnitaire || plat.prix || 0
                    };
                }
                platsGroupes[idPlat].quantite = plat.quantite || 1;
            }
        });
    }

    // Convertir l'objet groupé en tableau
    this.platQuantites = Object.values(platsGroupes);

    if (this.platQuantites.length === 0) {
        console.error('❌ Aucun plat trouvé dans la structure:', commande);
        this.errorMessage = 'Aucun plat trouvé dans cette commande';
    } else {
        console.log('✅ Plats extraits et groupés:', this.platQuantites);
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCommande = null;
    this.selectedStatutPaiement = '';
  }

  modifierCommande(): void {
    if (!this.selectedCommande) return;

    // Préparer les données des plats
    const platQuantitesForBackend = this.platQuantites
      .filter(plat => plat.idPlat && plat.quantite > 0)
      .map(plat => ({
        idPlat: plat.idPlat,
        quantite: parseInt(plat.quantite.toString())
      }));

    console.log('📤 Données des plats envoyées au backend :', platQuantitesForBackend);
    console.log('💳 Nouveau statut de paiement :', this.selectedStatutPaiement);

    if (platQuantitesForBackend.length === 0) {
      this.errorMessage = 'Aucun plat valide à modifier';
      return;
    }

    this.isLoading = true;
    this.commandeService.modifierCommande(
      this.selectedCommande.idCmnd, 
      platQuantitesForBackend, 
      this.selectedStatutPaiement
    ).subscribe({
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

  updateQuantite(plat: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantite = parseInt(input.value);
    
    // Réinitialiser complètement la valeur
    if (!isNaN(newQuantite) && newQuantite >= 1) {
      plat.quantite = newQuantite; // Remplace la valeur directement
    } else {
      plat.quantite = 1;
      input.value = '1';
    }
    
    console.log('Quantité mise à jour:', plat.quantite); // Pour débogage
  }

  supprimerPlat(index: number): void {
    this.platQuantites.splice(index, 1);
  }

  // ===== MÉTHODES POUR ADMIN CREATE COMMANDE =====

  resetAdminForm(): void {
    this.adminCommandeForm = {
      typeCommande: 'SUR_PLACE',
      platQuantites: [],
      username: ''
    };
    this.adminPlatQuantites = [];
  }

  onAdminTypeCommandeChange(): void {
    // Réinitialiser les champs spécifiques selon le type
    if (this.adminCommandeForm.typeCommande === 'SUR_PLACE') {
      this.adminCommandeForm.userId = undefined;
      this.adminCommandeForm.username = ''; 
      this.adminCommandeForm.adresse = undefined;
      this.adminCommandeForm.telephone = undefined;
    } else {
      this.adminCommandeForm.tableNumber = undefined;
    }
  }

  addPlatToAdminCommande(): void {
    this.adminPlatQuantites.push({
      idPlat: null,
      nom: '',
      quantite: 1,
      prix: 0
    });
  }

  removePlatFromAdminCommande(index: number): void {
    this.adminPlatQuantites.splice(index, 1);
  }

  updateAdminPlatQuantite(plat: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantite = parseInt(input.value);
    
    if (!isNaN(newQuantite) && newQuantite >= 1) {
      plat.quantite = newQuantite;
    } else {
      plat.quantite = 1;
      input.value = '1';
    }
  }

  adminCreateCommande(): void {
    // Validation des données
    if (this.adminPlatQuantites.length === 0) {
      this.errorMessage = 'Veuillez ajouter au moins un plat';
      return;
    }

    // Validation spécifique selon le type de commande
    if (this.adminCommandeForm.typeCommande === 'A_DOMICILE') {
      if (!this.adminCommandeForm.username || !this.adminCommandeForm.adresse || !this.adminCommandeForm.telephone) {
        this.errorMessage = 'Veuillez remplir tous les champs requis pour une commande à domicile';
        return;
      }
    } else if (this.adminCommandeForm.typeCommande === 'SUR_PLACE') {
      if (!this.adminCommandeForm.tableNumber) {
        this.errorMessage = 'Veuillez spécifier le numéro de table';
        return;
      }
    }

    // Préparer les données des plats
    const platQuantitesForBackend = this.adminPlatQuantites
      .filter(plat => plat.idPlat && plat.quantite > 0)
      .map(plat => ({
        idPlat: parseInt(plat.idPlat.toString()),
        quantite: parseInt(plat.quantite.toString())
      }));

    if (platQuantitesForBackend.length === 0) {
      this.errorMessage = 'Aucun plat valide sélectionné';
      return;
    }

    // Préparer la requête
    const request: AdminCommandeRequest = {
      typeCommande: this.adminCommandeForm.typeCommande,
      platQuantites: platQuantitesForBackend
    };

    // Ajouter les champs spécifiques selon le type
    if (this.adminCommandeForm.typeCommande === 'A_DOMICILE') {
      request.username = this.adminCommandeForm.username;  // Utiliser username au lieu de userId
      request.adresse = this.adminCommandeForm.adresse;
      request.telephone = this.adminCommandeForm.telephone;
    } else {
      request.tableNumber = this.adminCommandeForm.tableNumber;
    }

    console.log('📤 Requête admin create commande :', request);

    this.isLoading = true;
    this.errorMessage = '';

    this.commandeService.adminCreateCommande(request).subscribe({
      next: (response) => {
        console.log('Réponse complète du serveur:', response); // Debug important
        this.successMessage = 'Commande ajoutée avec succès !';
        this.errorMessage = '';
        console.log('Message de succès défini:', this.successMessage); // Vérifiez ce log
        
        this.loadCommandes();
        this.resetAdminForm();
        this.isLoading = false;
        
        setTimeout(() => {
          this.successMessage = '';
          console.log('Message de succès effacé'); // Vérifiez ce log
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur complète:', err); // Debug important
        this.errorMessage = 'Erreur: ' + (err.error?.message || err.message || 'Erreur inconnue');
        this.successMessage = '';
        this.isLoading = false;
      }
    });
  }

  // Méthode pour charger les plats disponibles (à implémenter selon votre API)
  loadAvailablePlats(): void {
    // Exemple d'implémentation - adaptez selon votre service
    // this.platService.getAllPlats().subscribe({
    //   next: (plats) => {
    //     this.availablePlats = plats;
    //   },
    //   error: (err) => {
    //     console.error('Erreur lors du chargement des plats:', err);
    //   }
    // });
  }
}