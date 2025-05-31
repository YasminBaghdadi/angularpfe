import { Component, OnInit } from '@angular/core';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service'; // ✅ corrigé ici
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-accueil-client',
  templateUrl: './accueil-client.component.html',
  styleUrls: ['./accueil-client.component.css']
})
export class AccueilClientComponent implements OnInit {
  nombreArticles: number = 0;
  username: string | null = '';

  constructor(
    private panierService: AccueilpanierService, // ✅ corrigé ici
    private authService: AuthService
  ) {}
  isChatModalOpen = false;

  openChatModal(): void {
    this.isChatModalOpen = true;
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
  }
  ngOnInit(): void {
    // ✅ S'abonner au nombre d'articles via AccueilpanierService
    this.panierService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });

    this.username = localStorage.getItem('username');
  }

  onLogout(): void {
    this.authService.logout();
  }
}
