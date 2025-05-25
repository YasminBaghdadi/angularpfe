// src/app/services/client-passager.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface SessionResponse {
  sessionId: number;
  tableNumber: number;
  expiresAt: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientPassagerService {
  private readonly STORAGE_KEY = 'client_passager_session';
  private apiUrl = 'http://localhost:8081/clientPassager';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidSession());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private tableInfoSubject = new BehaviorSubject<{tableNumber: number, sessionId: number} | null>(null);
  public tableInfo$ = this.tableInfoSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadSessionData();
  }

  scanQRCode(qrText: string): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.apiUrl}/start-session`, { qrText })
      .pipe(
        tap(response => {
          this.storeSessionData(response);
          this.router.navigate(['/interface']);
        })
      );
  }

  passerCommande(plats: any[]): Observable<any> {
    const sessionData = this.getSessionData();
    if (!sessionData) {
      throw new Error('Aucune session active');
    }
    
    const token = this.getToken();
    
    return this.http.post<any>(
      `${this.apiUrl}/passerCommande/${sessionData.tableNumber}`, 
      plats,
      { headers: { 'X-Session-Token': token || '' } }
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.isAuthenticatedSubject.next(false);
    this.tableInfoSubject.next(null);
    this.router.navigate(['/scan']);
  }

  private storeSessionData(response: SessionResponse): void {
    const sessionData = {
      token: response.token,
      sessionId: response.sessionId,
      tableNumber: response.tableNumber,
      expiresAt: response.expiresAt
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    this.isAuthenticatedSubject.next(true);
    this.tableInfoSubject.next({
      tableNumber: response.tableNumber,
      sessionId: response.sessionId
    });
  }

  private loadSessionData(): void {
    if (this.hasValidSession()) {
      const sessionData = this.getSessionData();
      if (sessionData) {
        this.tableInfoSubject.next({
          tableNumber: sessionData.tableNumber,
          sessionId: sessionData.sessionId
        });
      }
    }
  }

  getSessionData(): {sessionId: number, tableNumber: number, expiresAt: string, token: string} | null {
    const sessionDataStr = localStorage.getItem(this.STORAGE_KEY);
    return sessionDataStr ? JSON.parse(sessionDataStr) : null;
  }

  getToken(): string | null {
    const sessionData = this.getSessionData();
    return sessionData?.token || null;
  }

  hasValidSession(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;
    
    const expiresAt = new Date(sessionData.expiresAt).getTime();
    const now = new Date().getTime();
    return expiresAt > now;
  }
}