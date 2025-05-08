
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject } from 'rxjs';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface DecodedToken {
  role: string;
  name: string;
  // autres claims
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userPayload : any;

  constructor(private http: HttpClient) { 
    this.userPayload=this.decodedToken()
  }
  private jwtHelper: JwtHelperService = new JwtHelperService();
  private baseUrl: string ='http://localhost:8081/projet'
  login(credentials: { username: string, password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials, {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    }).pipe(
      catchError((error: any) => {
        let errorMsg = 'Login failed';
        if (error.error?.error) {
          errorMsg = error.error.error;
        } else if (error.status === 401) {
          errorMsg = 'Invalid credentials';
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  getToken(){
    return localStorage.getItem('token')
  }
  isLoggedIn(){
    return !!localStorage.getItem('token')
  }
  decodedToken(): DecodedToken {
    const token = this.getToken();
    if (!token) return {} as DecodedToken;
    
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }
  createAuthorization(){
    let authHeader = new HttpHeaders();
    const token  = this.getToken();
    if(token){
      authHeader=authHeader.set('Authorization','Bearer'+token);
    }
    return authHeader;
  }
  private fullName$ = new BehaviorSubject<string>("");
  private email$ = new BehaviorSubject<string>("");
  private role$ = new BehaviorSubject<string>("");
  private user$ = new BehaviorSubject<any | null>("null");

  public getUser()
  {
    return this.user$.asObservable()
  }

  public setUser(user:any){
    this.user$.next(user);
  }


  public getRoleFromStore()
  {
    return this.role$.asObservable()
  }

  public setRoleForStore(role:string){
    this.role$.next(role);
  }

  getLogedUser(){
    if(this.userPayload){
      return this.userPayload
    }
  }

}
