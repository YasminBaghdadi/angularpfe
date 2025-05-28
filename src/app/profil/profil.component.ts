import { Component, OnInit } from '@angular/core';
import { CustomerService } from '../services/customer.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { CommandeService } from '../services/commande.service';
import { ReservationService } from '../services/reservation.service';

interface Commande {
  idCmnd: number;
  total: number;
  typeCommande: string;
  statutPaiement: string;
  adresseLivraison?: string;
  telephoneLivraison?: string;
  dateCommande: Date;
  details?: any[];
}

interface Reservation {
  idReservation: number;
  nomClient: string;
  dateReservation: Date;
  numberPersonne: number;
  numeroTel: number;
  tab: {
    id: number;
    number: number;
  };
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface User {
  id?: number;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  password?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  user: User = {
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  };

  userRole: string | null = null;
  originalUserData: User | null = null;

  isLoading = true;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  commandes: Commande[] = [];
  commandesLoading = false;
  commandesError: string | null = null;

  reservations: Reservation[] = [];
  reservationsLoading = false;
  reservationsError: string | null = null;
  isShowingReservations = false;

  isShowingHistorique = false;
  historique: string[] = [];
  historiqueLoading = false;
  historiqueError: string | null = null;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router,
    private commandeService: CommandeService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.loadUserData();
    this.loadCommandes();
    this.loadReservations();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'PAYER_EN_LIGNE': 'Payé en ligne',
      'PAYER_ESPECE': 'Payé en espèces',
      'ANNULEE': 'Annulée'
    };
    return statusMap[status] || status;
  }

  loadUserData(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.customerService.getUserById(userId).subscribe({
      next: (data) => {
        this.user = {
          ...data,
          password: '',
          confirmPassword: ''
        };
        this.originalUserData = { ...data };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement user:', err);
        this.errorMessage = 'Erreur lors du chargement des données utilisateur';
        this.isLoading = false;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadCommandes(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.commandesLoading = true;
    this.commandesError = null;

    this.commandeService.getCommandesByUser(userId).subscribe({
      next: (commandes) => {
        this.commandes = commandes.map((cmd: any) => ({
          idCmnd: cmd.idCmnd,
          total: cmd.total || 0,
          typeCommande: cmd.typeCommande || 'Non spécifié',
          statutPaiement: cmd.statutPaiement || 'EN_ATTENTE',
          adresseLivraison: cmd.adresseLivraison,
          telephoneLivraison: cmd.telephoneLivraison,
          dateCommande: new Date(cmd.dateCommande),
          details: cmd.details || []
        }));
        this.commandesLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement commandes:', err);
        this.commandesError = err.error?.message || 'Erreur lors du chargement des commandes';
        this.commandesLoading = false;
      }
    });
  }

  loadReservations(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.reservationsLoading = true;
    this.reservationsError = null;

    this.reservationService.getReservationsByUser(Number(userId)).subscribe({
      next: (reservations) => {
        this.reservations = reservations.map((res: any) => ({
          idReservation: res.idReservation,
          nomClient: res.nomClient || 'Non spécifié',
          dateReservation: new Date(res.dateReservation),
          numberPersonne: res.numberPersonne || 1,
          numeroTel: res.numeroTel || 0,
          tab: {
            id: res.tab?.idTable || res.tab?.id || 0,
            number: res.tab?.number || 0
          },
          user: {
            id: res.user?.idUser || res.user?.id || 0,
            firstname: res.user?.firstname || '',
            lastname: res.user?.lastname || ''
          }
        }));
        this.reservationsLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement réservations:', err);
        this.reservationsError = err.error?.message || 'Erreur lors du chargement des réservations';
        this.reservationsLoading = false;
      }
    });
  }

  viewReservations(): void {
    this.isShowingReservations = true;
    this.loadReservations();
  }

  closeReservations(): void {
    this.isShowingReservations = false;
  }

  viewHistorique(): void {
    this.isShowingHistorique = true;
    this.loadCommandes();
  }

  closeHistorique(): void {
    this.isShowingHistorique = false;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.clearMessages();
    if (!this.isEditing) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.originalUserData) {
      this.user = {
        ...this.originalUserData,
        password: '',
        confirmPassword: ''
      };
    }
  }

  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.commandesError = null;
    this.historiqueError = null;
    this.reservationsError = null;
  }

  get passwordsDoNotMatch(): boolean {
    return this.user.password !== this.user.confirmPassword;
  }

  updateProfile(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement.';
      return;
    }

    if (this.passwordsDoNotMatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    const updatedData: any = {
      firstname: this.user.firstname,
      lastname: this.user.lastname,
      email: this.user.email,
      username: this.user.username
    };

    if (this.user.password?.trim()) {
      updatedData.password = this.user.password;
    }

    this.isLoading = true;
    this.clearMessages();

    this.customerService.updateUser(userId, updatedData).subscribe({
      next: () => {
        this.successMessage = 'Profil mis à jour avec succès.';
        this.isEditing = false;
        this.isLoading = false;

        this.originalUserData = { ...this.user };
        this.user.password = '';
        this.user.confirmPassword = '';
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil.';
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
