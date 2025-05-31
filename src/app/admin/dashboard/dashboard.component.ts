import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
    notifications: string[] = [];

  constructor(private authService: AuthService,
        private notificationService: NotificationService

  ){}
    username: string | null = '';
 ngOnInit(): void {
    this.username = localStorage.getItem('username');

    this.notificationService.getNotifications().subscribe(notifs => {
      this.notifications = notifs;
    });
  }

   onLogout(): void {
    this.authService.logout();
  }

}
