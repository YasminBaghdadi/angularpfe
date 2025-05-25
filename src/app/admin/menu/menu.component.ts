import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  plat = {
    name: '',
    description: '',
    prix: null as number | null,
    categorie: '',
  };

  currentPlat = {
    idPlat: null as number | null,
    name: '',
    description: '',
    prix: null as number | null,
    categorie: '',
  };

  isEditMode = false;
  errorMessage: string = '';
  successMessage: string = '';
  username: string | null = '';
  selectedFile: File | null = null;
  groupedPlats: { [categorie: string]: any[] } = {};
  plats: any[] = [];
  showEditForm: boolean = false;
  
  // Gestion de la suppression par modal
  showDeleteModal: boolean = false;
  platToDelete: number | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.loadPlats();
  }

  loadPlats(): void {
    this.http.get<any[]>('http://localhost:8081/Plat/getplats').subscribe({
      next: (data) => {
        this.plats = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des plats", err);
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    this.showEditForm = false;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.plat.name.trim() ||
      !this.plat.description.trim() ||
      this.plat.prix === null ||
      this.plat.prix <= 0 ||
      !this.plat.categorie ||
      !this.selectedFile
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs et sélectionner une image valide.';
      return;
    }

    this.http.post<any>('http://localhost:8081/Plat/addplat', this.plat).subscribe({
      next: (result) => {
        const idPlat = result?.idPlat;
        if (!idPlat) {
          this.errorMessage = "ID du plat non reçu.";
          return;
        }

        const formData = new FormData();
        formData.append('imageFile', this.selectedFile as Blob);

        this.http.post(`http://localhost:8081/Image/uploadPlatImage/${idPlat}`, formData, { responseType: 'text' }).subscribe({
          next: () => {
            this.successMessage = 'Plat et image ajoutés avec succès';
            this.plat = { name: '', description: '', prix: null, categorie: '' };
            this.selectedFile = null;
            this.errorMessage = '';
            this.loadPlats(); // Recharge la liste après ajout
          },
          error: (error) => {
            console.error("Erreur upload image:", error);
            this.errorMessage = "Erreur lors de l'upload de l'image: " + (error?.message || 'Erreur inconnue');
            this.successMessage = '';
          }
        });
      },
      error: (error) => {
        console.error("Erreur ajout plat:", error);
        this.errorMessage = "Erreur lors de l'ajout du plat: " + (error?.message || 'Erreur inconnue');
        this.successMessage = '';
      }
    });
  }

  // Méthode pour ouvrir le modal de modification avec les données du plat sélectionné
  openEditModal(plat: any): void {
    this.currentPlat = {
      idPlat: plat.idPlat,
      name: plat.name,
      description: plat.description,
      prix: plat.prix,
      categorie: plat.categorie
    };
    this.isEditMode = true;
    
    // Ouvrir le modal (utilise Bootstrap via JavaScript)
    const modal = document.getElementById('editUserModal');
    if (modal) {
      // @ts-ignore - Pour éviter les erreurs TypeScript avec les méthodes Bootstrap
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  // Méthode pour fermer le modal
  closeEditModal(): void {
    const modal = document.getElementById('editUserModal');
    if (modal) {
      // @ts-ignore
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) {
        bsModal.hide();
      }
    }
  }

  // Méthode pour mettre à jour un plat
  updatePlat(): void {
    if (!this.currentPlat.idPlat) {
      this.errorMessage = "ID du plat non valide";
      return;
    }

    if (
      !this.currentPlat.name.trim() ||
      !this.currentPlat.description.trim() ||
      this.currentPlat.prix === null ||
      this.currentPlat.prix <= 0 ||
      !this.currentPlat.categorie
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    this.http.put<any>(`http://localhost:8081/Plat/update/${this.currentPlat.idPlat}`, this.currentPlat).subscribe({
      next: () => {
        this.successMessage = 'Plat modifié avec succès';
        this.closeEditModal();
        this.loadPlats(); // Recharge la liste après modification
      },
      error: (error) => {
        console.error("Erreur lors de la modification du plat:", error);
        this.errorMessage = "Erreur lors de la modification du plat: " + (error?.message || 'Erreur inconnue');
      }
    });
  }

  // Nouvelle méthode pour ouvrir le modal de suppression
  openDeleteModal(idPlat: number): void {
    this.platToDelete = idPlat;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  // Nouvelle méthode pour fermer le modal de suppression
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.platToDelete = null;
    document.body.classList.remove('modal-open');
  }

  // Nouvelle méthode pour confirmer la suppression
  confirmDelete(): void {
    if (this.platToDelete) {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      this.http.delete(`http://localhost:8081/Plat/deleteplat/${this.platToDelete}`, { headers }).subscribe({
        next: () => {
          this.successMessage = 'Plat supprimé avec succès';
          this.closeDeleteModal();
          this.loadPlats(); // Recharge la liste après suppression
        },
        error: (error) => {
          console.error("Erreur suppression plat:", error);
          this.errorMessage = "Erreur lors de la suppression du plat : " + (error?.message || 'Erreur inconnue');
          this.closeDeleteModal();
        }
      });
    }
  }

  // Méthode obsolète remplacée par openDeleteModal et confirmDelete
  deletePlat(idPlat: number): void {
    // Maintenant cette méthode appelle simplement openDeleteModal
    this.openDeleteModal(idPlat);
  }
}