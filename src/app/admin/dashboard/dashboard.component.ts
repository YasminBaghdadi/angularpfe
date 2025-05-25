import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  constructor(private authService: AuthService){}
    username: string | null = '';
  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    
  }

   onLogout(): void {
    this.authService.logout();
  }

}
