import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlatService } from 'src/app/services/plat.service';
import { ImageplatService } from 'src/app/services/imageplat.service';
import { Plat } from 'src/app/models/plat';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { AccueilpanierService } from 'src/app/services/accueilpanier.service';
@Component({
  selector: 'app-plats',
  templateUrl: './plats.component.html',
  styleUrls: ['./plats.component.css']
})
export class PlatsComponent implements OnInit, OnDestroy {
  plats: Plat[] = [];
  selectedCategory: string = 'Petit-déjeuner';
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();
messageConfirmation: string = '';

  constructor(
    private platService: PlatService,
    private imageplatService: ImageplatService,
    private panierService: AccueilpanierService, // Remplacez PanierService par AccueilpanierService
    private authService: AuthService
  ) {}

  nombreArticles: number = 0;
  username: string | null = '';

  ngOnInit(): void {
    // S'abonner au service pour récupérer le nombre d'articles dans le panier
    this.panierService.nombreArticles$.subscribe(nombre => {
      this.nombreArticles = nombre;
    });

    this.username = localStorage.getItem('username');
    this.loadPlats();
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlats(): void {
    this.loading = true;
    this.error = null;

    this.platService.getPlatsByCategorie(this.selectedCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plats) => {
          this.plats = plats.map(plat => ({
            ...plat,
            quantite: 1,
            imageUrl: '/assets/imgs/our-collections/shape-1.jpg' 
          }));
          this.loadAllPlatImages();
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Échec du chargement des plats: ${err.message || 'Erreur inconnue'}`;
          this.loading = false;
        }
      });
  }

  loadAllPlatImages(): void {
    const imageRequests = this.plats
      .filter(plat => !!plat.idPlat)
      .map(plat => 
        this.imageplatService.getPlatImage(plat.idPlat!)
          .pipe(
            takeUntil(this.destroy$),
            catchError(() => of('/assets/imgs/our-collections/shape-1.jpg'))
          )
      );

    if (imageRequests.length > 0) {
      forkJoin(imageRequests)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (imageUrls) => {
            imageUrls.forEach((imageUrl, index) => {
              const plat = this.plats[index];
              if (plat) {
                plat.imageUrl = imageUrl;
              }
            });
          },
          error: (err) => {
            console.error('Error loading images:', err);
          }
        });
    }
  }

  onCategorieChange(categorie: string): void {
    this.selectedCategory = categorie;
    this.loadPlats();
  }

  commander(plat: Plat): void {
  const quantite = plat.quantite ?? 1;
  const total = plat.prix * quantite;
  this.panierService.ajouterAuPanier({ ...plat, quantite });

  this.messageConfirmation = `✔️ ${quantite} x ${plat.name} ajouté au panier (${total.toFixed(2)} TND)`;

  // Efface le message après 3 secondes
  setTimeout(() => {
    this.messageConfirmation = '';
  }, 3000);
}



  
}