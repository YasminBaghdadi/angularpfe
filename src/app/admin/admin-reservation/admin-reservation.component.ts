import { Component, OnInit } from '@angular/core';
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
  username: string | null = '';
  searchTerm = '';

  showDeleteModal = false;
  reservationToDelete: Reservation | null = null;

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.loadReservations();
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

  onLogout(): void {
    this.authService.logout();
  }

  // Ouvre la modal de confirmation de suppression
  openDeleteModal(reservation: Reservation): void {
    this.reservationToDelete = reservation;
    this.showDeleteModal = true;
  }

  // Ferme la modal sans supprimer
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.reservationToDelete = null;
  }

  // Confirme la suppression de la réservation sélectionnée
  confirmDelete(): void {
    if (!this.reservationToDelete) return;

    this.reservationService.deleteReservation(this.reservationToDelete.idReservation).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.idReservation !== this.reservationToDelete?.idReservation);
        this.filteredReservations = this.filteredReservations.filter(r => r.idReservation !== this.reservationToDelete?.idReservation);
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.errorMessage = 'Erreur lors de la suppression de la réservation';
        this.closeDeleteModal();
      }
    });
  }
}
