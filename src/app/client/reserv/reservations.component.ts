import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service';
import { ReservationService } from 'src/app/services/reservation.service';
import { NotificationService } from 'src/app/services/notification.service';

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
  isChatModalOpen = false;

  reservation = {
    nomClient: '',
    dateReservation: '',
    heure: '',
    numberPersonne: 1,
    numeroTel: '',
    message: ''
  };

  constructor(
    private panierService: AccueilpanierService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private notificationService: NotificationService
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
    this.panierService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });
  }

  openChatModal(): void {
    this.isChatModalOpen = true;
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
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
    this.sendAdminNotification(response);
    this.resetForm();
    this.clearMessageAfterTimeout();
  }

  private sendAdminNotification(response: any): void {
    try {
      const formattedDate = this.formatDate(this.reservation.dateReservation);
      const formattedTime = this.reservation.heure;
      
      this.notificationService.addReservationNotificationWithMessage(
        this.reservation.nomClient,
        formattedDate,
        formattedTime,
        this.reservation.numberPersonne,
        response.table,
        this.reservation.numeroTel,
        this.reservation.message
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  }

  private createNotificationMessage(
    nomClient: string, 
    date: string, 
    heure: string, 
    nombrePersonnes: number, 
    table?: string,
    message?: string
  ): string {
    let notificationText = `Nouvelle réservation de ${nomClient} pour ${nombrePersonnes} personne${nombrePersonnes > 1 ? 's' : ''} le ${date} à ${heure}`;
    
    if (table) notificationText += ` - Table: ${table}`;
    if (message && message.trim()) notificationText += `\nMessage: "${message}"`;
    
    return notificationText;
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  private handleError(error: any): void {
    console.error('Erreur lors de la réservation:', error);
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