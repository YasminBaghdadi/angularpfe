import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private baseUrl = 'http://localhost:8081/projet';

  constructor(private http: HttpClient) {}

  addUserWithConfirmPassword(user: any): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/addwithconfpassword`,
      user,
      { responseType: 'text' as const }  // important !
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMsg = typeof error.error === 'string' ? error.error : 'Erreur inconnue !';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  
}
