import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.css']
})
export class DashComponent {
  constructor( private authService: AuthService) { }
username: string | null = '';
  ngOnInit(): void {

    this.username = localStorage.getItem('username');


  }
  onLogout(): void {
    this.authService.logout();
  }
}
