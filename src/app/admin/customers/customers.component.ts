import { Component, OnInit } from '@angular/core';
import { RegisterService } from 'src/app/services/register.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/services/customer.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  userForm!: FormGroup;
  formSubmitted = false;
  users: any[] = []; 
  page: number = 0; 
  size: number = 10; 
  totalPages: number = 0; 
  totalUsers: number = 0;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private customerService: CustomerService // ✅ Virgule corrigée ici
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstname: [''],
      lastname: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: this.fb.group({
        idRole: [1]
      })
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(fg: FormGroup): { [key: string]: boolean } | null {
    const password = fg.get('password')?.value;
    const confirmPassword = fg.get('confirmPassword')?.value;

    return password && confirmPassword && password === confirmPassword
      ? null
      : { mismatch: true };
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    const formData = {
      ...this.userForm.value,
      role: { idRole: this.userForm.value.role.idRole }
    };

    this.registerService.addUserWithConfirmPassword(formData).subscribe({
      next: (res) => {
        if (res.includes('successfully')) {
          this.handleSuccess(res);
        } else {
          this.handleError({ message: res });
        }
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private handleSuccess(response: any): void {
    console.log('Enregistrement réussi:', response);
    alert('Enregistrement réussi !');
    this.formSubmitted = false;
    this.userForm.reset();
    this.loadUsers(); // Recharge les utilisateurs après ajout
  }

  private handleError(error: any): void {
    console.error('Erreur lors de l\'enregistrement:', error);

    let errorMessage = 'Erreur lors de l\'enregistrement';

    if (error.error?.includes('L’email existe déjà')) {
      errorMessage = 'Cet email est déjà utilisé';
      this.userForm.get('email')?.setErrors({ emailExists: true });
    } else if (error.error?.includes('Les mots de passe ne correspondent pas')) {
      errorMessage = 'Les mots de passe ne correspondent pas';
      this.userForm.setErrors({ mismatch: true });
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(errorMessage);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get f() {
    return this.userForm.controls;
  }

   // Charger les utilisateurs selon la page et la taille
   loadUsers(): void {
    this.customerService.getAllUsers(this.page, this.size).subscribe({
      next: (res) => {
        this.users = res; // Liste d'utilisateurs sans pagination
        this.totalPages = 1; // Il n'y a qu'une seule page dans ce cas
        this.totalUsers = res.length; // Nombre total d'utilisateurs
      },
      error: (err) => {
        console.error('Erreur de chargement des utilisateurs', err);
      }
    });
  }
  

  // Passer à la page suivante
  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadUsers();
    }
  }



  deleteUser(userId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.customerService.deleteUser(userId).subscribe({
        next: () => {
          // Recharge la liste des utilisateurs après suppression
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'utilisateur', err);
        }
      });
    }
  }
}
