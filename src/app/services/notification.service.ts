import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'reservation' | 'commande' | 'livraison' | 'info' | 'warning' | 'error'; // Ajout du type 'livraison'
  timestamp: Date;
  read: boolean;
  clientName?: string;
  table?: string;
  clientMessage?: string;
  // Champs pour les commandes
  commandeId?: number;
  montantTotal?: number;
  nombrePlats?: number;
  plats?: any[];
  // Nouveaux champs pour les livraisons
  livraisonId?: number;
  adresseLivraison?: string;
  telephone?: string;
  tempsEstimeLivraison?: string;
  fraisLivraison?: number;
  statutLivraison?: string;
  details?: {
    date: string;
    time: string;
    persons: number;
    phone?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private notifications: Notification[] = [];

  constructor() {
    // Charger les notifications depuis le localStorage au démarrage
    this.loadNotificationsFromStorage();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  addNotification(message: string, type: 'reservation' | 'commande' | 'livraison' | 'info' | 'warning' | 'error' = 'info', details?: any) {
    const notification: Notification = {
      id: this.generateId(),
      message,
      type,
      timestamp: new Date(),
      read: false,
      ...details
    };
    
    this.notifications.unshift(notification); // Ajouter au début de la liste
    this.saveNotificationsToStorage();
    this.notificationsSubject.next([...this.notifications]);
  }

  // Méthode spécifique pour les réservations avec plus de détails
  addReservationNotification(
    nomClient: string, 
    dateReservation: string, 
    heure: string, 
    numberPersonne: number,
    table?: string
  ) {
    const message = `Nouvelle réservation de ${nomClient} pour ${numberPersonne} personne${numberPersonne > 1 ? 's' : ''} le ${dateReservation} à ${heure}${table ? ` - Table: ${table}` : ''}`;
    
    const details = {
      clientName: nomClient,
      table: table,
      details: {
        date: dateReservation,
        time: heure,
        persons: numberPersonne
      }
    };

    this.addNotification(message, 'reservation', details);
  }

  // Nouvelle méthode pour les réservations avec message du client
  addReservationNotificationWithMessage(
    nomClient: string, 
    dateReservation: string, 
    heure: string, 
    numberPersonne: number,
    table?: string,
    phone?: string,
    clientMessage?: string
  ) {
    let message = `Nouvelle réservation de ${nomClient} pour ${numberPersonne} personne${numberPersonne > 1 ? 's' : ''} le ${dateReservation} à ${heure}`;
    
    if (table) {
      message += ` - Table: ${table}`;
    }

    const details = {
      clientName: nomClient,
      table: table,
      clientMessage: clientMessage,
      details: {
        date: dateReservation,
        time: heure,
        persons: numberPersonne,
        phone: phone
      }
    };

    this.addNotification(message, 'reservation', details);
  }

  // Méthode pour les notifications de commandes
  addCommandeNotification(
    commandeId: number | null,
    tableNumber: number | null,
    montantTotal: number,
    nombrePlats: number,
    plats: any[],
    clientMessage?: string
  ) {
    // Handle null commandeId case
    if (commandeId === null) {
      console.warn('Tentative de création de notification avec commandeId null');
      return;
    }

    const message = `Nouvelle commande #${commandeId} - Table ${tableNumber} - ${montantTotal.toFixed(2)} TND (${nombrePlats} article${nombrePlats > 1 ? 's' : ''})`;
    
    const details = {
      commandeId: commandeId,
      table: tableNumber,
      montantTotal: montantTotal,
      nombrePlats: nombrePlats,
      plats: plats,
      clientMessage: clientMessage
    };

    this.addNotification(message, 'commande', details);
  }

  // NOUVELLE MÉTHODE: Ajouter une notification de livraison
addLivraisonNotification(
  livraisonId: number,
  clientName: string,
  adresseLivraison: string,
  telephone: string,
  montantTotal: number,
  nombrePlats: number,
  plats: any[],
  tempsEstimeLivraison?: string,
  fraisLivraison?: number,
  clientMessage?: string
) {
  const message = `Nouvelle commande livraison #${livraisonId} - ${clientName} - ${montantTotal.toFixed(2)} TND`;
  
  const details = {
    livraisonId: livraisonId,
    commandeId: livraisonId, // Ajouté pour compatibilité
    clientName: clientName,
    adresseLivraison: adresseLivraison,
    telephone: telephone,
    montantTotal: montantTotal,
    nombrePlats: nombrePlats,
    plats: plats.map(plat => ({
      nom: plat.nom,
      quantite: plat.quantite,
      prix: plat.prix || plat.prixUnitaire // Selon votre structure
    })),
    tempsEstimeLivraison: tempsEstimeLivraison || '30-45 min',
    fraisLivraison: fraisLivraison || 0,
    statutLivraison: 'En préparation',
    clientMessage: clientMessage
  };

  this.addNotification(message, 'livraison', details);
}

  // NOUVELLE MÉTHODE: Mettre à jour le statut d'une livraison
  updateLivraisonStatus(livraisonId: number, nouveauStatut: string) {
    const notification = this.notifications.find(n => 
      n.type === 'livraison' && n.livraisonId === livraisonId
    );
    
    if (notification) {
      notification.statutLivraison = nouveauStatut;
      
      // Créer une nouvelle notification pour le changement de statut
      const statusMessage = `Livraison #${livraisonId} - Statut mis à jour: ${nouveauStatut}`;
      this.addNotification(statusMessage, 'livraison', {
        livraisonId: livraisonId,
        statutLivraison: nouveauStatut,
        clientName: notification.clientName,
        adresseLivraison: notification.adresseLivraison
      });
    }
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotificationsToStorage();
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveNotificationsToStorage();
    this.notificationsSubject.next([...this.notifications]);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  clearNotifications() {
    this.notifications = [];
    this.saveNotificationsToStorage();
    this.notificationsSubject.next([]);
  }

  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotificationsToStorage();
    this.notificationsSubject.next([...this.notifications]);
  }

  getReservationNotifications(): Notification[] {
    return this.notifications.filter(n => n.type === 'reservation');
  }

  getCommandeNotifications(): Notification[] {
    return this.notifications.filter(n => n.type === 'commande');
  }

  // NOUVELLE MÉTHODE: Obtenir les notifications de livraisons
  getLivraisonNotifications(): Notification[] {
    return this.notifications.filter(n => n.type === 'livraison');
  }

  // NOUVELLE MÉTHODE: Obtenir les livraisons par statut
  getLivraisonsByStatus(statut: string): Notification[] {
    return this.notifications.filter(n => 
      n.type === 'livraison' && n.statutLivraison === statut
    );
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private saveNotificationsToStorage(): void {
    try {
      // Limiter le nombre de notifications stockées (par exemple, 100 maximum)
      const notificationsToSave = this.notifications.slice(0, 100);
      localStorage.setItem('admin_notifications', JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notifications:', error);
    }
  }

  private loadNotificationsFromStorage(): void {
    try {
      const saved = localStorage.getItem('admin_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convertir les timestamps string en objets Date
        this.notifications = parsed.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        this.notificationsSubject.next([...this.notifications]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      this.notifications = [];
    }
  }
}