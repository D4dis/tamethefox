import { Injectable, inject } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socketService = inject(SocketService);
  private username: string | null = null;

  constructor() { }

  login(pseudo: string): void {
    this.username = pseudo;
    this.socketService.sendNewUser(pseudo);
  }

  logout(): void {
    this.username = null;
    this.socketService.getSocket().emit('Logout');
  }

  isLoggedIn(): boolean {
    return this.username !== null;
  }

  getUsername(): string | null {
    return this.username;
  }

  sendMessage(message: string): void {
    this.socketService.sendMessage(message);
  }

  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socketService.onMessage((msg) => observer.next(msg));
    });
  }

  onNewUser(): Observable<any> {
    return new Observable(observer => {
      this.socketService.onNewUser((user) => observer.next(user));
    });
  }

  onLogout(): Observable<any> {
    return new Observable(observer => {
      this.socketService.getSocket().on('logout', (user) => observer.next(user));
    });
  }

  onAllUsers(): Observable<any> {
    return new Observable(observer => {
      this.socketService.onAllUsers((users) => observer.next(users));
    })
  }
}
