import { Component, OnInit } from '@angular/core';
import { RegisterService } from 'src/app/services/register.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/services/customer.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  // Formulaires
  userForm!: FormGroup;
  editForm!: FormGroup;
  
  // Messages
  errorMessage: string = '';
  successMessage: string = '';

  // Données
  users: any[] = [];
  selectedUser: any = null;
  showEditForm: boolean = false;
  showDeleteModal: boolean = false;
  userToDelete: number | null = null;
  loading: boolean = false;

  // Pagination
  page: number = 0;
  size: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;

  // Auth
  username: string | null = '';

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private customerService: CustomerService,
    private router: Router,
    private authService: AuthService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.loadUsers();
  }

  private initForms(): void {
    // Formulaire d'ajout
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstname: [''],  // Prénom
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Formulaire de modification
    this.editForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstname: [''],  // Prénom
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private passwordMatchValidator(fg: FormGroup): {[key: string]: boolean} | null {
    return fg.get('password')?.value === fg.get('confirmPassword')?.value 
      ? null 
      : { mismatch: true };
  }

  loadUsers(): void {
    this.loading = true;
    this.customerService.getAllUsers(this.page, this.size).subscribe({
      next: (response: any) => {
        this.users = response.content || response;
        // Log des données pour débugger
        console.log('Users chargés:', this.users);
        this.totalPages = response.totalPages || 1;
        this.totalElements = response.totalElements || response.length;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des clients';
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const formData = {
      ...this.userForm.value,
      role: { idRole: 3 }
    };

    // Log des données envoyées au serveur
    console.log('Données envoyées pour création:', formData);

    this.registerService.register(formData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Client ajouté avec succès';
        this.userForm.reset();
        this.loadUsers();
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = 'Cet email est déjà utilisé';
          this.userForm.get('email')?.setErrors({ emailExists: true });
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement';
        }
      }
    });
  }

  onEdit(user: any): void {
    this.selectedUser = user;
    this.showEditForm = true;

    // Log de l'utilisateur à modifier pour debug
    console.log('Utilisateur à modifier:', user);

    this.editForm.patchValue({
      username: user.username,
      firstname: user.firstname || user.lastname, // Prénom - essaie d'abord firstname, puis lastname si firstname n'existe pas
      email: user.email
    });

    // Ajout de la classe au body pour empêcher le défilement
    document.body.classList.add('modal-open');

    this.errorMessage = '';
    this.successMessage = '';
  }

  onSaveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const updatedData = {
      ...this.editForm.value,
      idUser: this.selectedUser.idUser,
      role: this.selectedUser.role
    };

    // Log des données à mettre à jour
    console.log('Données à mettre à jour:', updatedData);

    this.customerService.updateUser(this.selectedUser.idUser, updatedData)
      .subscribe({
        next: () => {
          this.successMessage = 'Client modifié avec succès';
          this.showEditForm = false;
          this.selectedUser = null;
          this.editForm.reset();
          // Retirer la classe du body
          document.body.classList.remove('modal-open');
          this.loadUsers();
        },
        error: (err) => {
          console.error("Erreur modification:", err);
          this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        }
      });
  }

  onCancelEdit(): void {
    this.showEditForm = false;
    this.selectedUser = null;
    this.editForm.reset();
    // Retirer la classe du body
    document.body.classList.remove('modal-open');
  }

  // Nouvelle méthode pour ouvrir le modal de suppression
  openDeleteModal(userId: number): void {
    this.userToDelete = userId;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  // Nouvelle méthode pour fermer le modal de suppression
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
    document.body.classList.remove('modal-open');
  }

  // Nouvelle méthode pour confirmer la suppression
  confirmDelete(): void {
    if (this.userToDelete) {
      this.customerService.deleteUser(this.userToDelete).subscribe({
        next: (response: any) => {
          this.successMessage = response.message || 'Client supprimé avec succès';
          this.closeDeleteModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error("Erreur de suppression:", err);
          this.errorMessage = err.error?.error || err.message || 'Erreur lors de la suppression';

          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          this.closeDeleteModal();
        }
      });
    }
  }

  // Pagination
  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadUsers();
    }
  }

  onLogout(): void {
    this.authService.logout();
  }

  // Accès simplifié aux contrôles
  get f() { return this.userForm.controls; }
  get ef() { return this.editForm.controls; }
}