// chat-component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { SocketService } from '../../services/socket.service';
import { ChatMessage } from '../../models/chat-model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-component.html',
  styleUrl: './chat-component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  currentMessage = '';
  messages: ChatMessage[] = [];
  filteredMessages: ChatMessage[] = [];
  isConnected = false;
  socketConnected = false;
  currentUserId = '';
  selectedUserId: string | null = null;
  selectedUserName = '';
  selectedUserEmoji = '';

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    // Obtenir l'ID du socket
    this.currentUserId = this.socketService.getSocket().id || '';

    // Vérifier l'état de connexion
    this.socketConnected = this.socketService.getSocket().connected;

    // S'abonner à la sélection d'utilisateur
    this.subscriptions.push(
      this.userService.getSelectedUser().subscribe(userId => {
        this.selectedUserId = userId;
        this.filterMessages();
        this.shouldScrollToBottom = true;
      })
    );

    // S'abonner aux messages privés
    this.socketService.getSocket().on('private-message', (message: ChatMessage) => {
      console.log('Message privé reçu:', message);
      this.messages.push(message);

      // Filtrer si c'est pour la conversation actuelle
      if (this.isMessageForCurrentConversation(message)) {
        this.filterMessages();
        this.shouldScrollToBottom = true;
      }
    });

    // S'abonner à la connexion de l'utilisateur
    this.subscriptions.push(
      this.userService.onConnected().subscribe(data => {
        this.currentUserId = data.id;
        this.isConnected = true;
        console.log('Utilisateur connecté dans chat:', data);
      })
    );

    // S'abonner à la liste des utilisateurs pour obtenir les infos
    this.subscriptions.push(
      this.userService.onUserList().subscribe(users => {
        if (this.selectedUserId) {
          const selectedUser = users.find(u => u.id === this.selectedUserId);
          if (selectedUser) {
            this.selectedUserName = selectedUser.pseudo;
            this.selectedUserEmoji = selectedUser.emoji;
          }
        }
      })
    );

    // Écouter l'état de connexion du socket
    this.socketService.getSocket().on('connect', () => {
      this.socketConnected = true;
      console.log('Socket connecté');
    });

    this.socketService.getSocket().on('disconnect', () => {
      this.socketConnected = false;
      this.isConnected = false;
      console.log('Socket déconnecté');
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    // Nettoyer les subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Nettoyer les listeners Socket.IO
    this.socketService.getSocket().off('private-message');
    this.socketService.getSocket().off('connect');
    this.socketService.getSocket().off('disconnect');
  }

  // Vérifier si un message appartient à la conversation actuelle
  private isMessageForCurrentConversation(message: ChatMessage): boolean {
    if (!this.selectedUserId) return false;

    // Message envoyé par moi à l'utilisateur sélectionné
    if (message.senderId === this.currentUserId && message.recipientId === this.selectedUserId) {
      return true;
    }

    // Message reçu de l'utilisateur sélectionné
    if (message.senderId === this.selectedUserId && message.recipientId === this.currentUserId) {
      return true;
    }

    return false;
  }

  // Filtrer les messages pour afficher seulement la conversation actuelle
  filterMessages(): void {
    if (!this.selectedUserId) {
      this.filteredMessages = [];
      return;
    }

    this.filteredMessages = this.messages.filter(msg =>
      this.isMessageForCurrentConversation(msg)
    );
  }

  // Envoyer un message privé
  sendMessage(): void {
    if (!this.currentMessage.trim() || !this.selectedUserId) {
      return;
    }

    const messageData = {
      recipientId: this.selectedUserId,
      message: this.currentMessage.trim()
    };

    console.log('Envoi du message privé:', messageData);
    this.chatService.sendPrivateMessage(messageData);
    this.currentMessage = '';
  }

  // Faire défiler jusqu'en bas
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Erreur lors du scroll:', err);
    }
  }

  // Obtenir la classe CSS pour un message
  getMessageClass(message: ChatMessage): string {
    if (message.senderId === this.currentUserId) {
      return 'message-sent';
    }
    return 'message-received';
  }

  // Obtenir le nom d'affichage de l'expéditeur
  getMessageSenderName(message: ChatMessage): string {
    if (message.senderId === this.currentUserId) {
      return 'Moi';
    }
    return message.senderDisplayName || 'Utilisateur';
  }

  // Formater l'horodatage
  formatTimestamp(timestamp: Date | string | undefined): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // TrackBy function pour optimiser le rendu des messages
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id || `${message.senderId}-${message.timestamp}-${index}`;
  }
}
