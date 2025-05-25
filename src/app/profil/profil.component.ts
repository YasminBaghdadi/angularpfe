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
    username: ''
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
        this.user = data;
        this.originalUserData = {...data};
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user data:', err);
        this.errorMessage = 'Erreur lors du chargement des données utilisateur';
        this.isLoading = false;
        // Rediriger vers login si l'utilisateur n'est pas authentifié
        if (err.status === 401) {
          this.authService.logout();
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
    this.user = {...this.originalUserData};
    this.errorMessage = null;
    this.successMessage = null;
  }

  updateProfile(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs requis correctement';
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/dash']);
      return;
    }

    const updatedData = {
      firstname: this.user.firstname,
      lastname: this.user.lastname,
      email: this.user.email
      // On ne met pas à jour le username car il est généralement immuable
    };

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.customerService.updateUser(userId, updatedData).subscribe({
      next: (response) => {
        this.isEditing = false;
        this.originalUserData = {...this.user};
        this.successMessage = 'Profil mis à jour avec succès';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil';
        this.isLoading = false;
      }
    });
  }
}