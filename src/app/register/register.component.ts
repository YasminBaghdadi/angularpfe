import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterService } from '../services/register.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  userForm!: FormGroup;
  formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService
  ) {}

  ngOnInit(): void {
    this.initForm();
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

  private passwordMatchValidator(fg: FormGroup): {[key: string]: boolean} | null {
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
  }

  private handleError(error: any): void {
    console.error('Erreur lors de l\'enregistrement:', error);
    
    let errorMessage = 'Erreur lors de l\'enregistrement';
    
    if (error.error?.includes('email already exists')) {
      errorMessage = 'Cet email est déjà utilisé';
      this.userForm.get('email')?.setErrors({ emailExists: true });
    } else if (error.error?.includes('Passwords do not match')) {
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

  get f() { return this.userForm.controls; }
}