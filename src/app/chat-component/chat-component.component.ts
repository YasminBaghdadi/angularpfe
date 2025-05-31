// 1. Modifier le composant chat pour supporter le modal
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input, Output, EventEmitter } from '@angular/core';
import { RestaurantChatService, ChatMessage } from 'src/app/services/restaurant-chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat-component.component.html',
  styleUrls: ['./chat-component.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  // Propriétés pour le modal
  @Input() isModalOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  private messagesSubscription!: Subscription;

  quickActions = [
    { label: '🥐 Petit déjeuner', message: 'Que proposez-vous pour le petit déjeuner ?' },
    { label: '🍽️ Menu du jour', message: 'Quel est le menu du déjeuner aujourd\'hui ?' },
    { label: '🥤 Boissons', message: 'Quelles boissons avez-vous ?' },
    { label: '🌙 Dîner', message: 'Que recommandez-vous pour le dîner ?' },
    { label: '📍 Réservation', message: 'Comment puis-je réserver une table ?' },
    { label: '🚚 Livraison', message: 'Faites-vous de la livraison ?' }
  ];

  constructor(private chatService: RestaurantChatService) {}

  ngOnInit(): void {
    this.messagesSubscription = this.chatService.messages$.subscribe(
      messages => {
        this.messages = messages;
        this.isLoading = false;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // Méthode pour fermer le modal
  onCloseModal(): void {
    this.closeModal.emit();
  }

  // Méthode pour gérer le clic sur le backdrop
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCloseModal();
    }
  }

  // Gérer la touche Escape
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCloseModal();
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;

    await this.chatService.sendMessage(message);
    
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  sendQuickMessage(message: string): void {
    this.currentMessage = message;
    this.sendMessage();
  }

  resetChat(): void {
    this.chatService.resetChat();
    this.currentMessage = '';
  }

  private scrollToBottom(): void {
    try {
      if (this.chatMessagesContainer) {
        const element = this.chatMessagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur lors du scroll:', err);
    }
  }
}