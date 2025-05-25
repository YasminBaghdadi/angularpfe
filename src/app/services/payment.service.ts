import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

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
  createPayment(idCommande: number, paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.baseUrl}/create/${idCommande}`,
      paymentRequest,
      { 
        headers: this.getQRHeaders() // Utiliser les headers QR pour toutes les commandes tables
      }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la création du paiement:', error);
        return throwError(() => error.error?.error || 'Erreur lors de la création du paiement');
      })
    );
  }

  // Exécuter le paiement
  executePayment(executeRequest: PaymentExecuteRequest): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/execute`,
      executeRequest,
      { headers: this.getQRHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'exécution du paiement:', error);
        return throwError(() => error.error?.error || 'Erreur lors de l\'exécution du paiement');
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