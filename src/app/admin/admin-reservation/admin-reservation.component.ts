import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservationService } from 'src/app/services/reservation.service';
import { AuthService } from 'src/app/services/auth.service';

interface Table {
  id: number;
  number: number;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
}

export interface Reservation {
  idReservation: number;
  nomClient: string;
  dateReservation: Date | string;
  numberPersonne: number;
  numeroTel: number | string;
  tab: Table;
  user: User;
}

@Component({
  selector: 'app-admin-reservation',
  templateUrl: './admin-reservation.component.html',
  styleUrls: ['./admin-reservation.component.css']
})
export class AdminReservationComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  username: string | null = '';
  searchTerm = '';

  // Formulaires
  reservationForm!: FormGroup;
  editForm!: FormGroup;

  // États pour modals & actions
  showDeleteModal = false;
  reservationToDelete: Reservation | null = null;

  showEditModal = false;
  reservationToEdit: Reservation | null = null;
  isUpdating = false;
  updateErrorMessage = '';

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.loadReservations();

    // Initialisation formulaire réservation
this.reservationForm = this.fb.group({
  clientName: ['', [Validators.required, Validators.minLength(3)]],
  reservationDate: ['', Validators.required],
  reservationTime: ['', Validators.required],
  numberOfPeople: ['', [Validators.required, Validators.min(1)]],
  numeroTel: ['', [
    Validators.required,
    Validators.pattern('^[0-9]{8,15}$')
  ]]
});


    // Initialisation formulaire modification
    this.editForm = this.fb.group({
      nomClient: ['', Validators.required],
      dateReservation: ['', Validators.required],
      numberPersonne: ['', [Validators.required, Validators.min(1)]],
      numeroTel: ['', Validators.required],
      idTable: ['', Validators.required]
    });
  }

  // Getter pour faciliter l'accès aux contrôles du formulaire
  get f() {
    return this.reservationForm.controls;
  }

  loadReservations(): void {
    this.isLoading = true;
    this.reservationService.getAllReservations().subscribe({
      next: (data: any[]) => {
        this.reservations = data.map(item => ({
          idReservation: item.idReservation ?? item.id,
          nomClient: item.nomClient,
          dateReservation: new Date(item.dateReservation),
          numberPersonne: item.numberPersonne,
          numeroTel: item.numeroTel,
          tab: {
            id: item.tab?.id ?? 0,
            number: item.tab?.number ?? 0
          },
          user: {
            id: item.user?.id ?? 0,
            firstname: item.user?.firstname ?? '',
            lastname: item.user?.lastname ?? ''
          }
        }));
        this.filteredReservations = [...this.reservations];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des réservations';
        this.isLoading = false;
        console.error('Erreur:', err);
      }
    });
  }

  filterReservations(): void {
    if (!this.searchTerm) {
      this.filteredReservations = [...this.reservations];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(reservation =>
      reservation.nomClient.toLowerCase().includes(term) ||
      reservation.numeroTel.toString().includes(term) ||
      (reservation.tab?.number?.toString().includes(term) ?? false)
    );
  }

 onSubmit(): void {
  if (this.reservationForm.invalid) {
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  const formData = this.reservationForm.value;
  const date = new Date(`${formData.reservationDate}T${formData.reservationTime}:00`);
  const formattedDate = date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + ' ' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0');

  const reservationData = {
    nomClient: formData.clientName,
    dateReservation: formattedDate,
    numberPersonne: formData.numberOfPeople,
    numeroTel: formData.numeroTel
  };

  this.reservationService.reserveradmin(reservationData).subscribe({
    next: () => {
      this.successMessage = 'Réservation créée avec succès';
      this.reservationForm.reset();
      this.loadReservations();
      this.isLoading = false;
    },
    error: (err) => {
      this.errorMessage = 'Erreur lors de la création de la réservation';
      console.error('Erreur:', err);
      this.isLoading = false;
    }
  });
}


  onLogout(): void {
    this.authService.logout();
  }

  // --- Suppression ---
  openDeleteModal(reservation: Reservation): void {
    this.reservationToDelete = reservation;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.reservationToDelete = null;
  }

  confirmDelete(): void {
    if (!this.reservationToDelete) return;

    this.reservationService.deleteReservation(this.reservationToDelete.idReservation).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.idReservation !== this.reservationToDelete?.idReservation);
        this.filteredReservations = this.filteredReservations.filter(r => r.idReservation !== this.reservationToDelete?.idReservation);
        this.closeDeleteModal();
        this.successMessage = 'Réservation supprimée avec succès';
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.errorMessage = 'Erreur lors de la suppression de la réservation';
        this.closeDeleteModal();
      }
    });
  }

  // --- Modification ---
  openEditModal(reservation: Reservation): void {
    this.reservationToEdit = reservation;
    this.updateErrorMessage = '';

    const date = new Date(reservation.dateReservation);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

    this.editForm.setValue({
      nomClient: reservation.nomClient,
      dateReservation: formattedDate,
      numberPersonne: reservation.numberPersonne,
      numeroTel: reservation.numeroTel.toString(),
      idTable: reservation.tab.id
    });

    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.reservationToEdit = null;
    this.editForm.reset();
  }

  submitEdit(): void {
    if (!this.reservationToEdit) return;

    if (this.editForm.invalid) {
      this.updateErrorMessage = 'Veuillez remplir correctement le formulaire.';
      return;
    }

    this.isUpdating = true;
    this.updateErrorMessage = '';

    const formValue = this.editForm.value;
    const dateLocal: string = formValue.dateReservation.replace('T', ' ');

    const updateData = {
      nomClient: formValue.nomClient,
      dateReservation: dateLocal,
      numberPersonne: formValue.numberPersonne,
      numeroTel: formValue.numeroTel,
      idTable: formValue.idTable
    };

    this.reservationService.updateReservation(this.reservationToEdit.idReservation, updateData).subscribe({
      next: (updatedReservation) => {
        const index = this.reservations.findIndex(r => r.idReservation === updatedReservation.id);
        if (index !== -1) {
          this.reservations[index] = {
            ...this.reservations[index],
            nomClient: updatedReservation.nomClient,
            dateReservation: new Date(updatedReservation.dateReservation),
            numberPersonne: updatedReservation.numberPersonne,
            numeroTel: updatedReservation.numeroTel,
            tab: updatedReservation.tab
          };
          this.filteredReservations = [...this.reservations];
        }
        this.isUpdating = false;
        this.closeEditModal();
        this.successMessage = 'Réservation mise à jour avec succès';
      },
      error: (err) => {
        console.error('Erreur lors de la modification:', err);
        this.updateErrorMessage = 'Erreur lors de la modification de la réservation.';
        this.isUpdating = false;
      }
    });
  }
}