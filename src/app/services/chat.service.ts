import { Injectable, inject } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socketService = inject(SocketService);

  constructor() { }

  // Connexion avec emoji
  login(emojiWithNumber: string): void {
    this.socketService.emit('newUser', emojiWithNumber);
  }

  // Déconnexion
  logout(): void {
    this.socketService.emit('logout');
  }

  // Envoyer un message privé
  sendPrivateMessage(data: { recipientId: string; message: string }): void {
    this.socketService.emit('message', data);
  }

  // Observer les messages privés
  onPrivateMessage(): Observable<any> {
    return this.socketService.on('private-message');
  }

  // Observer les nouveaux utilisateurs
  onNewUser(): Observable<any> {
    return this.socketService.on('newUser');
  }

  // Observer les déconnexions
  onLogout(): Observable<any> {
    return this.socketService.on('logout');
  }

  // Observer la liste des utilisateurs
  onAllUsers(): Observable<any> {
    return this.socketService.on('allUsers');
  }
}
