import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ImageplatService } from 'src/app/services/imageplat.service';
import { PanierService } from 'src/app/services/panier.service';
import { Plat } from 'src/app/models/plat';
import { PlatService } from 'src/app/services/plat.service';
@Component({
  selector: 'app-interface',
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.css']
})
export class InterfaceComponent implements OnInit, OnDestroy {
  isLoading = true;
  error: string | null = null;
  tableNumber: number | null = null;
  sessionId: string | null = null;
  token: string | null = null;
  expiresAt: string | null = null;
  plats: Plat[] = [];
  selectedCategory: string = 'Petit-déjeuner';
  loading = false;
  nombreArticles: number = 0;
messageConfirmation: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private platService: PlatService,
    private imageplatService: ImageplatService,
    private panierService: PanierService
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
  this.panierService.nombreArticles$
    .pipe(takeUntil(this.destroy$))
    .subscribe(nombre => {
      this.nombreArticles = nombre;
    });

  this.route.params.subscribe(params => {
    const tableNumber = params['tableNumber'];
    if (tableNumber) {
      const storedTableNumber = localStorage.getItem('tableNumber');
      if (storedTableNumber === tableNumber && this.checkSessionValidity()) {
        this.loadExistingSession();
      } else {
        this.startSessionForTable(tableNumber);
      }
    } else {
      this.error = 'Numéro de table manquant';
      this.isLoading = false;
    }
  });
  }

  startSessionForTable(tableNumber: string): void {
    const baseUrl = 'http://localhost:8081/clientPassager';
    const qrText = `http://localhost:4200/interface-table/${tableNumber}`;

    this.http.post(`${baseUrl}/start-session`, { qrText }).subscribe({
      next: (response: any) => {
        localStorage.setItem('sessionId', response.sessionId);
        localStorage.setItem('tableNumber', tableNumber);
        localStorage.setItem('expiresAt', response.expiresAt);
        localStorage.setItem('token', response.token);

        this.sessionId = response.sessionId;
        this.tableNumber = Number(tableNumber);
        this.expiresAt = response.expiresAt;
        this.token = response.token;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = err.status === 404 
          ? `La table ${tableNumber} n'existe pas` 
          : 'Erreur lors du démarrage de la session';
        this.isLoading = false;
      }
    });
  }

  loadExistingSession(): void {
    this.sessionId = localStorage.getItem('sessionId');
    this.tableNumber = Number(localStorage.getItem('tableNumber'));
    this.expiresAt = localStorage.getItem('expiresAt');
    this.token = localStorage.getItem('token');
    this.isLoading = false;
  }

  checkSessionValidity(): boolean {
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) return false;
    return new Date() < new Date(expiresAt);
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
            console.error('Erreur de chargement des images:', err);
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
  }, 3000);  }
}
