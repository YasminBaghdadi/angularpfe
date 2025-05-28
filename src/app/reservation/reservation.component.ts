import { Component } from '@angular/core';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent {
  reservation = {
    numberPersonne: null,
    dateReservation: '',
    heure: '',
    nomClient: '',
    numeroTel: '',
    message: ''
  };

  successMessage = '';
  errorMessage = '';

  // Simulation de l'état de connexion de l'utilisateur
  isLoggedIn = false; // ← Change cette valeur à `true` si l'utilisateur est connecté

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  reserver() {
    if (!this.isLoggedIn) {
      this.errorMessage = "Vous devez avoir un compte pour réserver.";
      this.successMessage = '';
      return;
    }

    // Sinon, simule la réservation réussie
    this.successMessage = "Réservation effectuée avec succès !";
    this.errorMessage = '';

    // Tu peux ici envoyer les données vers un backend ou les enregistrer ailleurs
    console.log("Réservation:", this.reservation);
  }
}
