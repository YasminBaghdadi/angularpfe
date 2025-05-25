import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map } from 'rxjs';
import { ActivatedRouteSnapshot } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
  return this.authService.isLoggedIn().pipe(
    map(isLoggedIn => {
      console.log('IS LOGGED IN:', isLoggedIn); // <--- à surveiller
      if (!isLoggedIn) {
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
}




  
}