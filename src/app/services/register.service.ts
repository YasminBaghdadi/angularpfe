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
    // Formattez les données EXACTEMENT comme le backend les attend
    const formattedUser = {
      username: user.username,
      firstname: user.firstname, // Notez l'orthographe exacte
      lastname: user.lastname,
      email: user.email,
      password: user.password,
      confirmPassword: user.confirmPassword // Doit correspondre exactement au champ de l'entité Java
    };
  
    return this.http.post(
      `${this.baseUrl}/addwithconfpassword`,
      formattedUser,
      { responseType: 'text' }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log complet pour débogage
        console.error('Erreur complète:', error);
        const errorMsg = error.error?.message || error.message || 'Erreur inconnue';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
}