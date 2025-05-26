import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, tap } from 'rxjs/operators';
export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
}

export interface PaymentResponse {
  status: string;
  paymentId: string;
  approvalUrl: string;
  idCommande: number;
}

export interface PaymentExecuteRequest {
  paymentId: string;
  payerId: string;
  idCommande: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  
  private baseUrl = 'http://localhost:8081/payment';
  private tauxChange = 0.33; // 1 TND = 0.33 USD (à remplacer par un service de taux de change réel)

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  convertTndToUsd(amountTnd: number): number {
    return parseFloat((amountTnd * this.tauxChange).toFixed(2));
  }
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  

  private getQRHeaders(): HttpHeaders {
    const sessionToken = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken || ''
    });
  }

  // Créer un paiement avec l'ID de commande
createPayment(idCommande: number, amountTnd: number): Observable<any> {
  const amountUsd = this.convertTndToUsd(amountTnd);
  
  const paymentRequest = {
    amount: amountUsd,
    currency: 'USD',
    description: `Paiement commande #${idCommande}`
  };

  return this.http.post<any>(
    `${this.baseUrl}/create/${idCommande}`,
    paymentRequest,
    { headers: this.getQRHeaders() }
  ).pipe(
    catchError(error => {
      console.error('Erreur création paiement:', error);
      // Renvoyer une erreur claire
      return throwError(() => ({
        error: error.error?.error || 'Erreur lors de la création du paiement',
        details: error
      }));
    })
  );
}

  // Exécuter le paiement
executePayment(executeRequest: PaymentExecuteRequest): Observable<any> {
    console.log('Envoi de la requête executePayment:', executeRequest);
    
    return this.http.post<any>(
        `${this.baseUrl}/execute`,
        executeRequest,
        { headers: this.getQRHeaders() }
    ).pipe(
        tap(response => console.log('Réponse du serveur:', response)),
        catchError(error => {
            console.error('Erreur PayPal:', error);
            return throwError(() => error.error?.error || 'Erreur lors du paiement');
        })
    );
}


  // Obtenir le statut du paiement
  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/status/${paymentId}`,
      { headers: this.getQRHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du statut:', error);
        return throwError(() => error.error?.error || 'Erreur lors de la récupération du statut');
      })
    );
  }
}