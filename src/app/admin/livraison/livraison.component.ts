import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import {
  LivraisonService,
  LivraisonResponseDTO,
  LivraisonSimpleResponseDTO
} from 'src/app/services/livraison.service';

@Component({
  selector: 'app-livraison',
  templateUrl: './livraison.component.html',
  styleUrls: ['./livraison.component.css']
})
export class LivraisonComponent implements OnInit {
  username: string | null = '';
  result: LivraisonResponseDTO | null = null;
  livraisonsParLivreur: LivraisonSimpleResponseDTO[] = [];
  idCommande: number = 0;
  usernameLivreurForm: string = '';
  usernameLivreurSearch: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  
  // Variables pour le modal de changement d'état
  showEditEtatForm: boolean = false;
  editEtatForm: FormGroup;
  livraisonEnCoursDeModification: LivraisonSimpleResponseDTO | null = null;

  constructor(
    private authService: AuthService,
    private livraisonService: LivraisonService,
    private fb: FormBuilder
  ) {
    this.editEtatForm = this.fb.group({
      nouvelEtat: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    if (this.username) {
      this.chargerLivraisonsParLivreurAvecUsername(this.username);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }

  assignerLivraison(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.usernameLivreurForm || !this.idCommande) {
      this.errorMessage = "Veuillez remplir tous les champs.";
      return;
    }

    this.livraisonService.assignerLivraison(this.idCommande, this.usernameLivreurForm).subscribe({
      next: () => {
        this.successMessage = "Livraison assignée avec succès !";
        this.errorMessage = '';
        this.idCommande = 0;
        this.usernameLivreurForm = '';

        const usernameToLoad = this.usernameLivreurSearch || this.username;
        if (usernameToLoad) {
          this.chargerLivraisonsParLivreurAvecUsername(usernameToLoad);
        }
      },
      error: (err) => {
        console.error(err);
        this.successMessage = '';
        this.errorMessage = err?.error || "Erreur lors de l'assignation.";
      }
    });
  }

  chargerLivraisonsParLivreur(): void {
    if (!this.usernameLivreurSearch) {
      this.livraisonsParLivreur = [];
      return;
    }

    this.chargerLivraisonsParLivreurAvecUsername(this.usernameLivreurSearch);
  }

  private chargerLivraisonsParLivreurAvecUsername(username: string): void {
    this.livraisonService.getLivraisonsParLivreur(username).subscribe({
      next: (data) => this.livraisonsParLivreur = data,
      error: (err) => {
        console.error(err);
        this.livraisonsParLivreur = [];
      }
    });
  }

  supprimerLivraison(idLivraison: number): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.livraisonService.deleteLivraison(idLivraison).subscribe({
      next: (message) => {
        this.successMessage = message;
        // Rafraîchir la liste après suppression
        const usernameToLoad = this.usernameLivreurSearch || this.username;
        if (usernameToLoad) {
          this.chargerLivraisonsParLivreurAvecUsername(usernameToLoad);
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error || "Erreur lors de la suppression.";
      }
    });
  }

  // Méthodes pour le changement d'état
  ouvrirModalChangementEtat(livraison: LivraisonSimpleResponseDTO): void {
    this.livraisonEnCoursDeModification = livraison;
    this.editEtatForm.patchValue({
      nouvelEtat: livraison.etatLivraison
    });
    this.showEditEtatForm = true;
  }

  onCancelEditEtat(): void {
    this.showEditEtatForm = false;
    this.livraisonEnCoursDeModification = null;
    this.editEtatForm.reset();
  }

  onSaveEditEtat(): void {
    if (this.editEtatForm.invalid || !this.livraisonEnCoursDeModification) {
      return;
    }

    const nouvelEtat = this.editEtatForm.value.nouvelEtat;
    
    this.livraisonService.changerEtatLivraison(
      this.livraisonEnCoursDeModification.idLivraison,
      nouvelEtat
    ).subscribe({
      next: (message) => {
        this.successMessage = message;
        this.errorMessage = '';
        this.showEditEtatForm = false;
        
        // Rafraîchir la liste
        const usernameToLoad = this.usernameLivreurSearch || this.username;
        if (usernameToLoad) {
          this.chargerLivraisonsParLivreurAvecUsername(usernameToLoad);
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error || "Erreur lors du changement d'état.";
        this.successMessage = '';
      }
    });
  }
}