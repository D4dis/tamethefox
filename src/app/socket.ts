import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';

interface User {
  id: string;
  pseudo: string;
  emoji: string;
  profile?: { qualities: string[]; feelings: string[] };
}

interface Message {
  sender: User;
  recipientId: string;
  text: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private selectedUserSubject = new BehaviorSubject<string | null>(null);
  selectedUser$ = this.selectedUserSubject.asObservable();

  constructor() {
    this.socket = io('http://localhost:3000', { autoConnect: true });
  }

  selectMood(emoji: string): void {
    this.socket.emit('select-mood', emoji);
  }

  onConnected(): Observable<{ id: string; pseudo: string; emoji: string }> {
    return new Observable((observer) => {
      this.socket.on('connected', (data) => observer.next(data));
    });
  }

  onUserList(): Observable<User[]> {
    return new Observable((observer) => {
      this.socket.on('user-list', (users: User[]) => observer.next(users));
    });
  }

  setSelectedUser(userId: string | null): void {
    this.selectedUserSubject.next(userId);
  }

  sendMessage(recipientId: string, text: string): void {
    this.socket.emit('send-message', { recipientId, text });
  }

  onNewMessage(): Observable<Message> {
    return new Observable((observer) => {
      this.socket.on('new-message', (message: Message) => observer.next(message));
    });
  }

  tameUser(userId: string, newName: string): void {
    this.socket.emit('tame-user', { userId, newName });
  }

  addProfileNote(userId: string, note: string, type: 'qualities' | 'feelings'): void {
    this.socket.emit('add-profile-note', { userId, note, type });
  }

  onProfileUpdated(): Observable<{
    userId: string;
    profile: { qualities: string[]; feelings: string[] };
  }> {
    return new Observable((observer) => {
      this.socket.on('profile-updated', (data) => observer.next(data));
    });
  }

  viewMyProfile(): void {
    this.socket.emit('view-my-profile');
  }

  onProfileViewed(): Observable<{ message: string }> {
    return new Observable((observer) => {
      this.socket.on('profile-viewed', (data) => observer.next(data));
    });
  }

  onError(): Observable<{ message: string }> {
    return new Observable((observer) => {
      this.socket.on('error', (data) => observer.next(data));
    });
  }
}
