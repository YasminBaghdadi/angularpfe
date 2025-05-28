import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { PanierclientService } from 'src/app/services/panierclient.service';
import { ReservationService } from 'src/app/services/reservation.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.css']
})
export class ReservationsComponent implements OnInit {
  @ViewChild('reservationForm') reservationForm!: NgForm;

  nombreArticles: number = 0;
  username: string | null = '';
  idUser: string | null = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  reservation = {
    nomClient: '',
    dateReservation: '',
    heure: '',
    numberPersonne: 1,
    numeroTel: '',
    message: ''
  };

  constructor(
    private panierclientService: PanierclientService,
    private authService: AuthService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.subscribeToCart();
  }

  private loadUserData(): void {
    this.username = localStorage.getItem('username');
    this.idUser = localStorage.getItem('user_id');
  }

  private subscribeToCart(): void {
    this.panierclientService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });
  }

  reserver(): void {
    if (this.reservationForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    if (!this.idUser) {
      this.errorMessage = 'Veuillez vous connecter pour effectuer une réservation';
      this.clearMessageAfterTimeout();
      return;
    }

    this.isLoading = true;
    const reservationData = this.prepareReservationData();

    this.reservationService.reserver(this.idUser, reservationData).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error),
      complete: () => this.isLoading = false
    });
  }

  private prepareReservationData(): any {
    const cleanPhone = this.reservation.numeroTel.toString().replace(/\D/g, '');
    const fullDateTime = `${this.reservation.dateReservation} ${this.reservation.heure}`;
    
    return {
      nomClient: this.reservation.nomClient,
      dateReservation: fullDateTime,
      numberPersonne: this.reservation.numberPersonne,
      numeroTel: cleanPhone,
      message: this.reservation.message
    };
  }

  private markAllAsTouched(): void {
    Object.keys(this.reservationForm.controls).forEach(key => {
      this.reservationForm.controls[key].markAsTouched();
    });
    this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
    this.clearMessageAfterTimeout();
  }

  private handleSuccess(response: any): void {
    this.successMessage = `Réservation réussie! Table: ${response.table}, Date: ${new Date(response.date).toLocaleString()}`;
    this.errorMessage = '';
    this.resetForm();
    this.clearMessageAfterTimeout();
  }

  private handleError(error: any): void {
    console.error('Erreur:', error);
    this.errorMessage = error.error?.error || 'Une erreur est survenue lors de la réservation';
    this.successMessage = '';
    this.clearMessageAfterTimeout();
  }

  private clearMessageAfterTimeout(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  private resetForm(): void {
    this.reservationForm.resetForm();
    this.reservation = {
      nomClient: '',
      dateReservation: '',
      heure: '',
      numberPersonne: 1,
      numeroTel: '',
      message: ''
    };
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onLogout(): void {
    this.authService.logout();
  }
}