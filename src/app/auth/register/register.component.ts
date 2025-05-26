import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from 'src/app/services/register.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  userForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstname: [''],
      lastname: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(fg: FormGroup): {[key: string]: boolean} | null {
    return fg.get('password')?.value === fg.get('confirmPassword')?.value 
      ? null 
      : { mismatch: true };
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const formData = {
      ...this.userForm.value,
      role: { idRole: 2 } // Rôle CLIENT
    };

    this.registerService.register(formData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Registration successful';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
  const errorMessage = err.error || 'Registration failed';
  this.errorMessage = errorMessage;

  if (errorMessage.includes('Nom d\'utilisateur déjà utilisé')) {
    this.userForm.get('username')?.setErrors({ usernameExists: true });
  }

  if (errorMessage.includes('Email déjà utilisé')) {
    this.userForm.get('email')?.setErrors({ emailExists: true });
  }
}

    });
  }

  get f() { return this.userForm.controls; }
}