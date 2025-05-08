


import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthentificationRequest } from 'src/app/models/authentification-request';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  authForm: FormGroup;
  authRequest: AuthentificationRequest = {};
  authResponse: any = {};

  constructor(
    private authService: AuthService, 
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.authForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

  error: string = "";
  message: string = '';

// Dans login.component.ts
// Dans login.component.ts
authentificate() {
  // Vérifie si le formulaire est valide
  if (this.authForm.invalid) {
    this.error = 'Veuillez remplir tous les champs requis';
    return;
  }

  // Prépare les identifiants avec des valeurs par défaut pour éviter undefined
  const credentials = {
    username: this.authForm.get('username')?.value?.trim() || '',
    password: this.authForm.get('password')?.value || ''
  };

  // Validation supplémentaire côté client
  if (!credentials.username || !credentials.password) {
    this.error = 'Nom d\'utilisateur et mot de passe sont requis';
    return;
  }

  console.log('Envoi des identifiants :', credentials);

  // Appel du service d'authentification
  this.authService.login(credentials).subscribe({
    next: (response) => {
      console.log('Réponse du serveur :', response);
      
      // Vérifie la présence du token dans la réponse
      if (!response?.accessToken) {
        this.error = 'Réponse du serveur invalide - token manquant';
        return;
      }

      // Stockage du token et traitement de la connexion réussie
      localStorage.setItem('token', response.accessToken);
      this.error = '';
      
      // Redirection ou autres actions après connexion
      this.handleSuccessfulLogin(response);
    },
    error: (error) => {
      console.error('Erreur de connexion :', error);
      
      if (error.status === 401) {
        this.error = 'Identifiant ou mot de passe incorrect';
      } else if (error.status === 0) {
        this.error = 'Impossible de se connecter au serveur';
      } else if (error.status === 403) {
        this.error = 'Accès refusé - compte désactivé';
      } else {
        this.error = `Erreur de connexion (${error.status || 'inconnue'})`;
      }
    }
  });
}

// Méthode séparée pour gérer la connexion réussie
private handleSuccessfulLogin(response: any) {
  // Décodage du token et mise à jour du state
  const tokenPayload = this.authService.decodedToken();
  if (tokenPayload) {
    this.authService.setRoleForStore(tokenPayload.role);
    this.authService.setUser(tokenPayload.name);
  }

  // Redirection basée sur le rôle
  const role = tokenPayload?.role || 'CLIENT';
  switch (role) {
    case 'ADMIN':
      this.router.navigate(['admin']);
      break;
    case 'CLIENT':
      this.router.navigate(['accueil']);
      break;
    default:
      this.router.navigate(['dash']);
  }
}

 

  
}