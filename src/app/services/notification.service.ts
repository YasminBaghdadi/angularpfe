import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new Subject<string[]>();
  private notifications: string[] = [];

  getNotifications(): Observable<string[]> {
    return this.notificationsSubject.asObservable();
  }

  addNotification(message: string) {
    this.notifications.push(message);
    this.notificationsSubject.next(this.notifications);
  }

  clearNotifications() {
    this.notifications = [];
    this.notificationsSubject.next(this.notifications);
  }
}
