import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plat } from '../models/plat';

@Injectable({
  providedIn: 'root'
})
export class PlatService {
 
  private apiUrl = 'http://localhost:8081/Plat'; 

  constructor(private http: HttpClient) {}

  getPlatsByCategorie(categorie: string): Observable<Plat[]> {
    return this.http.get<Plat[]>(`${this.apiUrl}/categorie/${categorie}`);
  }

 
}
