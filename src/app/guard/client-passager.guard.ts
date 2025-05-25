import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ClientPassagerService } from '../services/client-passager.service';

@Injectable({
  providedIn: 'root'
})
export class ClientPassagerGuard implements CanActivate {
   constructor(
    private clientPassagerService: ClientPassagerService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.clientPassagerService.hasValidSession()) {
      return true;
    } else {
      this.router.navigate(['/scan-qr']);
      return false;
    }
  }
}