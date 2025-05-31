import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlatService } from '../services/plat.service';
import { ImageplatService } from '../services/imageplat.service';
import { AccueilpanierService } from '../services/accueilpanier.service';
import { Plat } from '../models/plat';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-plat',
  templateUrl: './plat.component.html',
  styleUrls: ['./plat.component.css']
})
export class PlatComponent implements OnInit, OnDestroy {
  plats: Plat[] = [];
  selectedCategory: string = 'Petit-déjeuner';
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private platService: PlatService,
    private imageplatService: ImageplatService,
    private panierService: AccueilpanierService
  ) {}

   isChatModalOpen = false;

  openChatModal(): void {
    this.isChatModalOpen = true;
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
  }
  ngOnInit(): void {
    this.loadPlats();
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
    alert(`Commande : ${quantite} x ${plat.name} = ${total.toFixed(2)} TND`);
  }
}