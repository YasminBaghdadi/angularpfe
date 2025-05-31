import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class TabService {
  private apiUrl = 'http://192.168.1.30:8081/tab';
  private qrUrl = 'http://192.168.1.30:8081/qr';

  constructor(private http: HttpClient) { }

  addTable(table: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addTable`, table);
  }

  generateQRCode(tableId: number, qrText: string): Observable<any> {
    return this.http.post<any>(
      `${this.qrUrl}/generate/${tableId}`, 
      { qrText },
      { observe: 'response' } // Pour avoir toute la réponse
    );
  }

  getTables(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }


  gettabs(page: number = 0, size: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gettabs?page=${page}&size=${size}`);
  }

  updateTable(id: number, tableData: any) {
    return this.http.put(`http://192.168.1.30:8081/tab/update/${id}`, tableData);
  }


getQrCodeImage(id: number): Observable<Blob> {
  const token = localStorage.getItem('access_token'); // ou sessionStorage

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get(`http://192.168.1.30:8081/qr/getimagedeqr/${id}`, {
    headers,
    responseType: 'blob'
  });
}


deleteTable(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
}
}