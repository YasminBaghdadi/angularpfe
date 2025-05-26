import { Component, OnInit } from '@angular/core';
import { CustomerService, User } from 'src/app/services/customer.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modifierprofil',
  templateUrl: './modifierprofil.component.html'
})
export class ModifierprofilComponent implements OnInit {
  user: User = {
   idUser: 0,
  username: '',
  firstname: '',
  lastname:'',
  email: '',
  password: '',
  confirmPassword: ''
  };

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.user.idUser = userId;
      // Optionnel : charger les infos user si besoin
      // this.customerService.getUserById(userId).subscribe(data => this.user = data);
    } else {
      alert("Utilisateur non connecté !");
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (!this.user.idUser) return alert('ID utilisateur manquant');

    this.customerService.updateUser(this.user.idUser, this.user).subscribe({
      next: () => {
        alert('Profil mis à jour');
        this.router.navigate(['/profil']);
      },
      error: err => {
        alert('Erreur lors de la mise à jour');
        console.error(err);
      }
    });
  }
}
