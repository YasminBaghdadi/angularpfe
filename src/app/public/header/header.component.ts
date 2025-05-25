import { Component, OnInit } from '@angular/core';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service';


@Component({
  selector: 'app-header', 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'] 
})
export class HeaderComponent implements OnInit {
  nombreArticles: number = 0;

  constructor(private accueilPanierService: AccueilpanierService) { }
  ngOnInit(): void {
    // S'abonner au service pour récupérer le nombre d'articles dans le panier
    this.accueilPanierService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });
  }
}

