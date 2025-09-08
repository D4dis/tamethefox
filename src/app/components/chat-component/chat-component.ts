import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
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
export class ChatComponent implements OnInit, OnDestroy {
  currentMessage = '';
  messages: ChatMessage[] = [];
  isConnected = true;
  socketConnected = false;
  currentPseudo = '';
  currentUserId = '';
  currentEmojiKey = '';
  allUsers: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService, private socketService: SocketService) {}

  ngOnInit() {
    // Vérifier l'état de connexion
    this.socketConnected = this.socketService.getSocket().connected;

    // S'abonner aux messages
    this.subscriptions.push(
      this.chatService.onMessage().subscribe(msg => {
        console.log('Message reçu dans le composant:', msg);
        this.messages.push(msg);
      })
    );

    // S'abonner aux nouveaux utilisateurs
    this.subscriptions.push(
      this.chatService.onNewUser().subscribe(user => {
        console.log('Nouvel utilisateur:', user);
        this.messages.push(user);
      })
    );

    // S'abonner aux déconnexions
    this.subscriptions.push(
      this.chatService.onLogout().subscribe(user => {
        console.log('Utilisateur parti:', user);
        this.messages.push(user);
      })
    );

    // S'abonner à la liste des utilisateurs
    this.subscriptions.push(
      this.chatService.onAllUsers().subscribe(users => {
        console.log('Liste des utilisateurs mise à jour:', users);
        this.allUsers = users;
      })
    );

    // Écouter les assignations de pseudo
    this.socketService.getSocket().on('pseudoAssigned', (data: any) => {
      console.log('Pseudo assigné:', data);
      // Mettre à jour l'affichage si nécessaire
    });

    // Écouter l'état de connexion du socket
    this.socketService.getSocket().on('connect', () => {
      this.socketConnected = true;
      console.log('Socket connecté');
    });

    this.socketService.getSocket().on('disconnect', () => {
      this.socketConnected = false;
      console.log('Socket déconnecté');
    });
  }

  ngOnDestroy() {
    // Se déconnecter proprement
    if (this.isConnected) {
      this.chatService.logout();
    }

    // Nettoyer les subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Méthode appelée pour rejoindre le chat avec un emoji
  joinChatWithPseudo(emojiKey: string) {
    if (emojiKey && this.socketConnected) {
      console.log('Tentative de connexion avec emoji:', emojiKey);
      this.chatService.login(emojiKey);
      this.currentEmojiKey = emojiKey;
      this.currentUserId = this.socketService.getSocket().id || '';
      this.isConnected = true;
    }
  }

  // Assigner un pseudo à un utilisateur
  assignPseudoToUser(userId: string, newPseudo: string) {
    if (newPseudo.trim()) {
      this.socketService.getSocket().emit('assignPseudo', {
        targetUserId: userId,
        newPseudo: newPseudo.trim()
      });
    }
  }

  sendMessage() {
    if (this.currentMessage.trim()) {
      this.chatService.sendMessage(this.currentMessage.trim());
      this.currentMessage = '';
    }
  }

  leaveChat() {
    this.chatService.logout();
    this.isConnected = false;
    this.messages = [];
    this.currentPseudo = '';
  }

  getMessageClass(message: ChatMessage): string {
    switch (message.status) {
      case 1: return 'join';
      case 2: return 'leave';
      default: return 'normal';
    }
  }

  getMessageSenderName(message: ChatMessage): string {
    // Si c'est un message de l'utilisateur actuel, afficher seulement son emoji
    if ((message as any).senderId === this.currentUserId) {
      return (message as any).senderEmote || message.senderEmote || '🤔';
    }
    // Sinon afficher le pseudo assigné ou le nom temporaire
    return message.senderDisplayName || message.pseudo || 'Utilisateur';
  }

  isMessageForCurrentUser(message: ChatMessage): boolean {
    return true;
  }

  getMessageTimestamp(message: ChatMessage): Date | null {
    return message.timestamp || null;
  }

}
