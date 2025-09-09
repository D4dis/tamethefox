import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  //https://tamethefox.onrender.com
  //
  //http://localhost:3000
  constructor() {
    this.socket = io('https://a9130b723e39.ngrok-free.app/', {
      transports: ['websocket', 'polling'],
      timeout: 60000,
    })
  };

  getSocket(): Socket {
    return this.socket;
  }

  sendNewUser(pseudo: string): void {
    this.socket.emit('newUser', pseudo);
  }

  onNewUser(callback: (user: any) => void): void {
    this.socket.on('newUser', callback);
  }

  onLogout(callback: (user: any) => void): void {
    this.socket.on('logout', callback);
  }

  onAllUsers(callback: (users: any) => void): void {
    this.socket.on('allUsers', callback);
  }

  // Core WebSocket communication methods only
  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  on<T = any>(event: string): Observable<T> {
    return new Observable((observer) => {
      this.socket.on(event, (data: T) => observer.next(data));
    });
  }

  off(event: string): void {
    this.socket.off(event);
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  connect(): void {
    this.socket.connect();
  }

  isConnected(): boolean {
    return this.socket.connected;
  }
}
