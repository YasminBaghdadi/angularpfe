import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TabService } from 'src/app/services/tab.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {
  tableNumber!: number;
  qrText: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  tables: any[] = [];

  // Pour la modification
  editForm!: FormGroup;
  showEditForm = false;
  selectedTableId!: number;

  // Pour affichage QR Code
  selectedQrImage: string | null = null;
  showQrModal = false;
  
  // Pour le modal de suppression
  showDeleteModal = false;
  tableToDelete: number | null = null;

  constructor(
    private tabService: TabService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  username: string | null = '';

  ngOnInit(): void {
    this.loadTables();
    this.username = localStorage.getItem('username');
   
    // Initialisation du formulaire de modification
    this.editForm = this.fb.group({
      number: ['', Validators.required],
    });
  }

  get ef() {
    return this.editForm.controls;
  }

  // Charger toutes les tables
  loadTables() {
    this.tabService.gettabs(0, 100).subscribe({
      next: (data) => {
        this.tables = data;
        console.log('Tables chargées :', this.tables);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des tables :', error);
        this.errorMessage = 'Impossible de charger les tables';
      }
    });
  }

  // Ajouter une table
  onSubmit() {
    const newTable = {
      number: this.tableNumber,
      disponible: true
    };

    this.tabService.addTable(newTable).subscribe({
      next: (response) => {
        if (response && response.idTable) {
          this.generateQRCode(response.idTable);
          this.loadTables();
        } else {
          this.errorMessage = 'Erreur : ID de table non reçu.';
        }
      },
      error: (error) => {
        console.error('Erreur lors de la création de la table:', error);
        this.errorMessage = 'Erreur : le numéro de table existe déjà.';
      }
    });
  }

  // Générer un QR code
  generateQRCode(tableId: number) {
    if (!this.qrText?.trim()) {
      this.qrText = `Table ${this.tableNumber}`;
    }

    this.tabService.generateQRCode(tableId, this.qrText).subscribe({
      next: (response) => {
        this.successMessage = 'Table et QR Code créés avec succès!';
        this.errorMessage = '';
      },
      error: (error) => {
        if (error.status === 200) {
          this.successMessage = 'Table et QR Code créés avec succès!';
        } else {
          this.errorMessage = 'Erreur QR Code : ' +
            (error.error?.message || error.message || JSON.stringify(error));
        }
      }
    });
  }

  // Éditer une table
  onEdit(table: any) {
    this.selectedTableId = table.idTable;
    this.editForm.setValue({
      number: table.number,
    });
    this.showEditForm = true;
  }

  onCancelEdit() {
    this.showEditForm = false;
    this.editForm.reset();
  }

  onSaveEdit() {
    if (this.editForm.valid) {
      const updatedTable = this.editForm.value;

      this.tabService.updateTable(this.selectedTableId, updatedTable).subscribe({
        next: (res) => {
          this.successMessage = 'Table modifiée avec succès.';
          this.showEditForm = false;
          this.loadTables(); // Rafraîchir la liste
        },
        error: (err) => {
          console.error('Erreur de modification', err);
          this.errorMessage = 'Erreur lors de la modification.';
        }
      });
    }
  }

  // Déconnexion
  onLogout(): void {
    this.authService.logout();
  }

  // Ouvrir la fenêtre modale pour afficher le QR code
  openQrModal(id: number): void {
    this.tabService.getQrCodeImage(id).subscribe({
      next: (imageBlob: Blob) => {
        imageBlob.arrayBuffer().then((buffer) => {
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          this.selectedQrImage = `data:image/png;base64,${base64}`;
          this.showQrModal = true;
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du QR code :', error);
      }
    });
  }

  // Fermer la modale QR
  closeQrModal(): void {
    this.showQrModal = false;
    this.selectedQrImage = null;
  }

  // Méthode pour ouvrir le modal de confirmation de suppression
  openDeleteModal(id: number): void {
    this.tableToDelete = id;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  // Méthode pour fermer le modal de suppression
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.tableToDelete = null;
    document.body.classList.remove('modal-open');
  }

  // Méthode pour confirmer la suppression
  confirmDelete(): void {
    if (this.tableToDelete) {
      this.tabService.deleteTable(this.tableToDelete).subscribe({
        next: () => {
          this.successMessage = 'Table supprimée avec succès';
          this.closeDeleteModal();
          this.loadTables(); // Recharger la liste
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
          this.errorMessage = 'Erreur lors de la suppression de la table';
          this.closeDeleteModal();
        }
      });
    }
  }

  // Ancienne méthode de suppression qui maintenant appelle openDeleteModal
  onDelete(id: number): void {
    this.openDeleteModal(id);
  }
}