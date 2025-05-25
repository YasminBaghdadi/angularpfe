import { Component, OnInit } from '@angular/core';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service'; // ✅ corrigé ici
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-pan',
  templateUrl: './pan.component.html',
  styleUrls: ['./pan.component.css']
})
export class PanComponent implements OnInit {
  nombreArticles: number = 0;
   username: string | null = '';
 
   constructor(
     private panierService: AccueilpanierService, // ✅ corrigé ici
     private authService: AuthService
   ) {}
 
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