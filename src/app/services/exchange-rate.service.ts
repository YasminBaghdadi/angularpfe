import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private apiUrl = 'https://api.exchangerate-api.com/v4/latest/TND';
  private tauxChange = 0.33; // Valeur par défaut

  constructor(private http: HttpClient) {
    this.updateTauxChange();
  }

  updateTauxChange(): void {
    this.http.get<any>(this.apiUrl).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data && data.rates && data.rates.USD) {
        this.tauxChange = data.rates.USD;
      }
    });
  }

  getTauxChange(): number {
    return this.tauxChange;
  }

  convertTndToUsd(amountTnd: number): number {
    return parseFloat((amountTnd * this.tauxChange).toFixed(2));
  }
}