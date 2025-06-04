import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService, Notification } from 'src/app/services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('allNotificationsModal') modal!: ElementRef<HTMLDialogElement>;
  
  notifications: Notification[] = [];
  displayedNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  unreadCount: number = 0;
  username: string | null = '';
  private notificationSubscription: Subscription = new Subscription();
  
  private readonly MAX_DISPLAYED_NOTIFICATIONS = 2;
  selectedFilter: string = 'all';
  selectedSort: string = 'newest';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}
 isChatModalOpen = false;

  openChatModal(): void {
    this.isChatModalOpen = true;
  }

  closeChatModal(): void {
    this.isChatModalOpen = false;
  }
  ngOnInit(): void {
    this.username = localStorage.getItem('username');
    this.subscribeToNotifications();
  }

  private subscribeToNotifications(): void {
    this.notificationSubscription = this.notificationService.getNotifications().subscribe(notifs => {
      this.notifications = notifs;
      this.displayedNotifications = this.notifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.MAX_DISPLAYED_NOTIFICATIONS);
      this.unreadCount = this.notificationService.getUnreadCount();
      this.applyFilter();
    });
  }

  openModal(): void {
    this.applyFilter();
    const modal = this.modal.nativeElement;
    if (modal) {
      modal.showModal();
      
      // Gestion de la fermeture en cliquant à l'extérieur
      modal.addEventListener('click', (event) => {
        const dialogDimensions = modal.getBoundingClientRect();
        if (
          event.clientX < dialogDimensions.left ||
          event.clientX > dialogDimensions.right ||
          event.clientY < dialogDimensions.top ||
          event.clientY > dialogDimensions.bottom
        ) {
          this.closeModal();
        }
      });
    }
  }

  closeModal(): void {
    const modal = this.modal.nativeElement;
    if (modal) {
      modal.close();
    }
  }

  applyFilter(): void {
    let filtered = [...this.notifications];
    
    switch (this.selectedFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'reservation':
        filtered = filtered.filter(n => n.type === 'reservation');
        break;
      case 'info':
        filtered = filtered.filter(n => n.type === 'info');
        break;
      case 'warning':
        filtered = filtered.filter(n => n.type === 'warning');
        break;
      case 'error':
        filtered = filtered.filter(n => n.type === 'error');
        break;
    }
    
    this.filteredNotifications = filtered;
    this.applySorting();
  }

  applySorting(): void {
    switch (this.selectedSort) {
      case 'newest':
        this.filteredNotifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        break;
      case 'oldest':
        this.filteredNotifications.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        break;
      case 'unread-first':
        this.filteredNotifications.sort((a, b) => {
          if (a.read === b.read) {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
          return a.read ? 1 : -1;
        });
        break;
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  get hiddenNotificationsCount(): number {
    return Math.max(0, this.notifications.length - this.MAX_DISPLAYED_NOTIFICATIONS);
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifications(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      this.notificationService.clearNotifications();
    }
  }

  removeNotification(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.removeNotification(notificationId);
  }

  handleModalAction(action: string, notificationId?: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    switch (action) {
      case 'markAsRead':
        if (notificationId) {
          this.markAsRead(notificationId);
        }
        break;
      case 'markAllAsRead':
        this.markAllAsRead();
        break;
      case 'remove':
        if (notificationId) {
          this.removeNotification(notificationId, event!);
        }
        break;
      case 'clearAll':
        this.clearAllNotifications();
        break;
      case 'viewDetails':
        if (notificationId) {
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            this.viewReservationDetails(notification);
          }
        }
        break;
    }
  }

  viewReservationDetails(notification: Notification): void {
    // Implémentez votre logique pour afficher les détails
    console.log('Voir détails de la réservation:', notification);
    this.closeModal();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'reservation': return 'bx bx-calendar-check';
      case 'info': return 'bx bx-info-circle';
      case 'warning': return 'bx bx-error';
      case 'error': return 'bx bx-x-circle';
      default: return 'bx bx-bell';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'reservation': return 'bg-success-subtle text-success';
      case 'info': return 'bg-info-subtle text-info';
      case 'warning': return 'bg-warning-subtle text-warning';
      case 'error': return 'bg-danger-subtle text-danger';
      default: return 'bg-primary-subtle text-primary';
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  }

  getNotificationTitle(notification: Notification): string {
    if (notification.type === 'reservation') {
      return `Réservation - ${notification.clientName || 'Client'}`;
    } else if (notification.type === 'info') {
      return 'Information';
    } else if (notification.type === 'warning') {
      return 'Avertissement';
    } else if (notification.type === 'error') {
      return 'Erreur';
    } else {
      return 'Notification';
    }
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}