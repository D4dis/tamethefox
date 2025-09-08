import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  constructor() {
    this.socket = io('https://tamethefox.onrender.com/', {
      transports: ['websocket', 'polling'],
      timeout: 60000,
    })
  };

  getSocket(): Socket {
    return this.socket;
  }

  getPseudo(): string {
    return (this.socket as any).pseudo;
  }

  sendMessage(message: string): void {
    this.socket.emit('message', message);
  }

  sendNewUser(pseudo: string): void {
    this.socket.emit('newUser', pseudo);
  }

  onMessage(callback: (message: any) => void): void {
    this.socket.on('message', callback);
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
}
