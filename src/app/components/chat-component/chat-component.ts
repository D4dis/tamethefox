import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatSocketService } from '../../services/chat-socket-service';
import { ChatMessage } from '../../models/chat-model';
import { User } from '../../models/user-model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-component.html',
  styleUrl: './chat-component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  currentMessage = '';
  messages: ChatMessage[] = [];
  users: User[] = [];
  isConnected = false;
  socketConnected = false;
  currentUserId = '';
  selectedTargetUser: User | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatSocketService) {}

  ngOnInit() {
    // S'abonner à l'état de connexion Socket.IO
    this.subscriptions.push(
      this.chatService.getConnectionStatus().subscribe(connected => {
        this.socketConnected = connected;
        console.log('Socket.IO connecté:', connected);
      })
    );

    // S'abonner aux messages
    this.subscriptions.push(
      this.chatService.getMessages().subscribe(msg => {
        console.log('Message reçu dans le composant:', msg);
        this.messages.push(msg);
      })
    );

    // S'abonner à la liste des utilisateurs
    this.subscriptions.push(
      this.chatService.getUsers().subscribe(users => {
        console.log('Liste des utilisateurs mise à jour:', users);
        this.users = users;
      })
    );

    // S'abonner à la réponse de connexion
    this.subscriptions.push(
      this.chatService.getUserResponse().subscribe(success => {
        if (success) {
          this.isConnected = true;
          this.currentUserId = this.chatService.getCurrentUserId();
          console.log('Connexion réussie ! ID:', this.currentUserId);
        }
      })
    );
  }

  ngOnDestroy() {
    // Se déconnecter proprement
    if (this.isConnected) {
      this.chatService.leaveChat();
    }

    // Nettoyer les subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Méthode appelée par le composant de login avec l'emote choisie
  joinChatWithEmote(emote: string) {
    if (emote && this.socketConnected) {
      console.log('Tentative de connexion avec emote:', emote);
      this.chatService.joinChat(emote);
    }
  }

  sendMessage() {
    if (this.currentMessage.trim()) {
      const isPrivate = this.selectedTargetUser !== null;
      const targetId = isPrivate ? this.selectedTargetUser!.id : undefined;

      this.chatService.sendMessage(this.currentMessage.trim(), isPrivate, targetId);
      this.currentMessage = '';
    }
  }

  selectTargetUser(user: User | null) {
    this.selectedTargetUser = user;
  }

  assignPseudoToUser(user: User, newPseudo: string) {
    if (newPseudo.trim()) {
      this.chatService.assignPseudo(user.id, newPseudo.trim());
    }
  }

  addNoteToUser(user: User, noteContent: string) {
    if (noteContent.trim()) {
      this.chatService.addUserNote(user.id, noteContent.trim());
    }
  }

  leaveChat() {
    this.chatService.leaveChat('Au revoir !');
    this.isConnected = false;
    this.messages = [];
    this.users = [];
  }

  getMessageClass(message: ChatMessage): string {
    let classes = '';

    switch (message.status) {
      case 0: classes += 'normal'; break;
      case 1: classes += 'join'; break;
      case 2: classes += 'leave'; break;
      default: classes += 'normal';
    }

    if ('isPrivate' in message && message.isPrivate) {
      classes += ' private';
    }

    return classes;
  }

  getUserDisplayName(user: User): string {
    return user.assignedPseudo || user.emote;
  }

  isMessageForCurrentUser(message: ChatMessage): boolean {
    if (!('isPrivate' in message) || !message.isPrivate) return true;
    return ('senderId' in message && message.senderId === this.currentUserId) ||
           ('targetUserId' in message && message.targetUserId === this.currentUserId);
  }

  getMessageTimestamp(message: ChatMessage): Date | null {
    if ('timestamp' in message && message.timestamp && message.timestamp instanceof Date) {
      return message.timestamp;
    }
    return null;
  }

  getMessageSenderName(message: ChatMessage): string {
    if ('senderDisplayName' in message && message.senderDisplayName) {
      return message.senderDisplayName;
    }
    if ('pseudo' in message && (message as any).pseudo) {
      return (message as any).pseudo;
    }
    return 'Utilisateur';
  }

  getMessageSenderEmote(message: ChatMessage): string {
    if ('senderEmote' in message && message.senderEmote) {
      return message.senderEmote;
    }
    return '👤';
  }
}
