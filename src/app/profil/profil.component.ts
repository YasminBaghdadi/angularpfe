import { Component, OnInit } from '@angular/core';
import { CustomerService } from '../services/customer.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  user: any = {
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  };
  isLoading = true;
  isEditing = false;
  originalUserData: any;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.customerService.getUserById(userId).subscribe({
      next: (data) => {
        this.user = {
          ...data,
          password: '',
          confirmPassword: ''
        };
        this.originalUserData = {...data};
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

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.user = {
      ...this.originalUserData,
      password: '',
      confirmPassword: ''
    };
    this.errorMessage = null;
    this.successMessage = null;
  }

  // Getter utilisé pour le template pour indiquer si les mots de passe ne correspondent pas
  get passwordsDoNotMatch(): boolean {
    return this.user.password !== this.user.confirmPassword;
  }

  updateProfile(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement.';
      return;
    }

    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Préparation des données à envoyer : ne pas envoyer password si vide
    const updatedData: any = {
      firstname: this.user.firstname,
      lastname: this.user.lastname,
      email: this.user.email,
      username: this.user.username
    };

    if (this.user.password && this.user.password.trim().length > 0) {
      updatedData.password = this.user.password;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.customerService.updateUser(userId, updatedData).subscribe({
      next: () => {
        this.isEditing = false;
        // Mettre à jour originalUserData avec les données mises à jour sans les mots de passe
        this.originalUserData = {
          firstname: this.user.firstname,
          lastname: this.user.lastname,
          email: this.user.email,
          username: this.user.username
        };
        this.user.password = '';
        this.user.confirmPassword = '';
        this.successMessage = 'Profil mis à jour avec succès.';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil.';
        this.isLoading = false;
      }
    });
  }
}
