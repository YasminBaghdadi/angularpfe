import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, tap } from 'rxjs/operators';

export interface SimplePaymentRequest {
  amount: number;
  currency: string;
  description?: string;
}

export interface SimplePaymentResponse {
  status: string;
  paymentId: string;
  approvalUrl: string;
  idCommande: number;
}

export interface SimplePaymentExecuteRequest {
  paymentId: string;
  payerId: string;
  idCommande: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimplePaymentService {
  
  private baseUrl = 'http://localhost:8081/payment';
  private tauxChange = 0.33; // 1 TND = 0.33 USD

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  private getReturnUrls() {
    const baseUrl = window.location.origin;
    
    return {
      successUrl: `${baseUrl}/simple-payment-success`,
      cancelUrl: `${baseUrl}/simple-payment-cancel`
    };
    
    
  }

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

  // Créer un paiement simple avec uniquement l'ID de commande
   createSimplePayment(idCommande: number, amountTnd: number): Observable<any> {
    const amountUsd = this.convertTndToUsd(amountTnd);
    const returnUrls = this.getReturnUrls();
    
    const paymentRequest = {
      amount: amountUsd,
      currency: 'USD',
      description: `Paiement commande #${idCommande}`,
      // Paramètres pour votre backend PayPal
      successUrl: returnUrls.successUrl + `?idCommande=${idCommande}`,
      cancelUrl: returnUrls.cancelUrl + `?idCommande=${idCommande}`
    };

    return this.http.post<SimplePaymentResponse>(
      `${this.baseUrl}/createauth/${idCommande}`,
      paymentRequest,
      { headers: this.getHeaders() }
    );
  }

  // Exécuter le paiement simple
  executeSimplePayment(executeRequest: SimplePaymentExecuteRequest): Observable<any> {
    console.log('Exécution paiement simple:', executeRequest);
    
    return this.http.post<any>(
      `${this.baseUrl}/execute`,
      executeRequest,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Paiement exécuté:', response)),
      catchError(error => {
        console.error('Erreur exécution paiement:', error);
        return throwError(() => error.error?.error || 'Erreur lors du paiement');
      })
    );
  }

  // Obtenir le statut du paiement
  getSimplePaymentStatus(paymentId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/status/${paymentId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur statut paiement:', error);
        return throwError(() => error.error?.error || 'Erreur lors de la récupération du statut');
      })
    );
  }

  savePaymentDetails(paymentId: string, idCommande: number, montantTotal: number, commandeDetails?: any): void {
    const paymentDetails = {
      paymentId: paymentId,
      idCommande: idCommande,
      montantTotal: montantTotal,
      commandeDetails: commandeDetails || null,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('simplePendingPayment', JSON.stringify(paymentDetails));
  }

  // Récupérer les détails du paiement en cours
  getPaymentDetails(): any {
    const details = localStorage.getItem('simplePendingPayment');
    return details ? JSON.parse(details) : null;
  }

  // Nettoyer les détails du paiement
  clearPaymentDetails(): void {
    localStorage.removeItem('simplePendingPayment');
    localStorage.removeItem('simplePaymentError');
  }

  // Sauvegarder une erreur de paiement
  savePaymentError(paymentId: string, error: string): void {
    const errorDetails = {
      paymentId: paymentId,
      error: error,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('simplePaymentError', JSON.stringify(errorDetails));
  }

  // Récupérer l'erreur de paiement
  getPaymentError(): any {
    const error = localStorage.getItem('simplePaymentError');
    return error ? JSON.parse(error) : null;
  }
}