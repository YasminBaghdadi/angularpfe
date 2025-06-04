import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { LivraisonService, LivraisonSimpleResponseDTO } from 'src/app/services/livraison.service';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.css']
})
export class DashComponent implements OnInit {

  username: string | null = '';
  livraisons: LivraisonSimpleResponseDTO[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private livraisonService: LivraisonService, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Initialisation du composant...');
    
    this.username = localStorage.getItem('username');
    
    console.log('Username:', this.username);
    
    if (this.username) {
      this.getLivraisons();
    } else {
      console.error('Aucun username trouvé dans localStorage');
      this.error = 'Utilisateur non identifié - username manquant';
    }
  }

  getLivraisons(): void {
    if (!this.username) {
      this.error = 'Username non défini';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    
    console.log(`Récupération des livraisons pour l'utilisateur: ${this.username}`);
    
    this.livraisonService.getLivraisonsParLivreur(this.username).subscribe({
      next: (data) => {
        console.log('Données reçues:', data);
        this.livraisons = data;
        this.loading = false;
        
        if (data.length === 0) {
          console.log('Aucune livraison trouvée');
        }
      },
      error: (err) => {
        console.error('Erreur complète:', err);
        this.error = `Erreur lors de la récupération: ${err.error || err.message || 'Erreur inconnue'}`;
        this.loading = false;
        this.livraisons = [];
      }
    });
  }

  changerEtatLivraison(idLivraison: number, nouvelEtat: string): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    console.log(`Changement de l'état de la livraison ${idLivraison} en ${nouvelEtat}`);

    this.livraisonService.changerEtatLivraison(idLivraison, nouvelEtat).subscribe({
      next: (msg) => {
        console.log('✅ Réponse:', msg);
        this.successMessage = msg;
        this.getLivraisons(); // Rafraîchir la liste après mise à jour
      },
      error: (err) => {
        console.error('❌ Erreur lors du changement d\'état:', err);
        this.error = `Erreur lors du changement d'état : ${err.error || err.message || 'Erreur inconnue'}`;
        this.loading = false;
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }

  // Méthode pour optimiser le rendu de la liste
  trackByLivraisonId(index: number, livraison: LivraisonSimpleResponseDTO): number {
    return livraison.idLivraison;
  }
}
