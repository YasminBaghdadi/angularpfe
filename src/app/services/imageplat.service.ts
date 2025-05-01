import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageplatService {
  private apiUrl = 'http://localhost:8081/Image';
  private imageCache = new Map<number, string>(); // Cache pour les images

  constructor(private http: HttpClient) { }

  getPlatImage(idPlat: number): Observable<string> {
    // Vérifier le cache d'abord
    if (this.imageCache.has(idPlat)) {
      return of(this.imageCache.get(idPlat)!);
    }

    return this.http.get(`${this.apiUrl}/getPlatImageUrl/${idPlat}`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        if (response.body) {
          const imageUrl = URL.createObjectURL(response.body);
          this.imageCache.set(idPlat, imageUrl); // Mettre en cache
          return imageUrl;
        }
        throw new Error('Image vide');
      }),
      catchError(() => {
        const defaultImage = 'assets/imgs/food-menu-tab/default-food.jpg';
        this.imageCache.set(idPlat, defaultImage); // Mettre en cache l'image par défaut
        return of(defaultImage);
      })
    );
  }
}