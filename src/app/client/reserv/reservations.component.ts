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
this.idUser = localStorage.getItem('user_id');  }

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
      alert('Veuillez vous connecter pour effectuer une réservation');
      return;
    }

    const reservationData = this.prepareReservationData();

    this.reservationService.reserver(this.idUser, reservationData).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error)
    });
  }

  private prepareReservationData(): any {
  const cleanPhone = this.reservation.numeroTel.toString().replace(/\D/g, '');
  const fullDateTime = `${this.reservation.dateReservation}T${this.reservation.heure}`;

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
    alert('Veuillez remplir tous les champs obligatoires');
  }

  private handleSuccess(response: any): void {
    alert(`Réservation réussie!\nTable: ${response.table}\nDate: ${response.date}`);
    this.resetForm();
  }

  private handleError(error: any): void {
    console.error('Erreur:', error);
    alert(error.error?.error || 'Une erreur est survenue lors de la réservation');
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
