import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseUrl = 'http://localhost:8081/projet';

  constructor(private http: HttpClient) {}

  getAllUsers(page: number = 0, size: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getAllusers?page=${page}&size=${size}`);
  }
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${userId}`);
  }
  
}
