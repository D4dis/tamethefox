import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../models/chat-model';
import { User } from '../models/user-model';

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private socket: Socket;
  private messages$ = new Subject<ChatMessage>();
  private users$ = new BehaviorSubject<User[]>([]);
  private currentUserId = '';
  private userResponse$ = new Subject<boolean>();
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.socket = io('https://tamethefox.onrender.com/', {
      transports: ['websocket'],
      reconnection: true,
      timeout: 5000,
      forceNew: true
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Gestion de la connexion
    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur Socket.IO - ID:', this.socket.id);
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur Socket.IO');
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Erreur de connexion Socket.IO:', error);
      this.connected$.next(false);
    });

    // Écouter les messages
    this.socket.on('message', (msg: ChatMessage) => {
      console.log('📨 Message reçu:', msg);
      this.messages$.next(msg);
    });

    // Écouter les nouveaux utilisateurs
    this.socket.on('newUser', (msg: ChatMessage) => {
      console.log('👋 Nouvel utilisateur:', msg);
      this.messages$.next(msg);
    });

    // Écouter les déconnexions
    this.socket.on('logout', (msg: ChatMessage) => {
      console.log('👋 Utilisateur parti:', msg);
      this.messages$.next(msg);
    });

    // Écouter la liste des utilisateurs
    this.socket.on('allUsers', (users: User[]) => {
      console.log('📋 Liste des utilisateurs reçue:', users);
      this.users$.next(users);
    });

    // Écouter les mises à jour d'utilisateurs
    this.socket.on('userUpdated', (user: User) => {
      console.log('🔄 Utilisateur mis à jour:', user);
      const currentUsers = this.users$.value;
      const updatedUsers = currentUsers.map(u => u.id === user.id ? user : u);
      this.users$.next(updatedUsers);
    });

    // Écouter la réponse d'ajout d'utilisateur
    this.socket.on('resUser', (response: { success: boolean, userId?: string }) => {
      console.log('✅ Réponse du serveur - connexion:', response);
      if (response.success && response.userId) {
        this.currentUserId = response.userId;
      }
      this.userResponse$.next(response.success);
    });
  }

  // Attendre que la connexion soit établie avant d'envoyer
  private waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket.connected) {
        resolve();
      } else {
        const subscription = this.connected$.subscribe(connected => {
          if (connected) {
            subscription.unsubscribe();
            resolve();
          }
        });
      }
    });
  }

  // Rejoindre le chat avec une emote
  async joinChat(emote: string) {
    console.log('🔄 Attente de la connexion Socket.IO...');

    try {
      // Attendre que la connexion soit établie
      await this.waitForConnection();

      console.log('🚀 Envoi de l\'emote au serveur:', emote);
      this.socket.emit('newUser', emote);

      // Timeout au cas où le serveur ne répond pas
      setTimeout(() => {
        if (!this.userResponse$.observers.length) {
          console.warn('⚠️ Aucune réponse du serveur après 3 secondes');
        }
      }, 3000);

    } catch (error) {
      console.error('🔥 Erreur lors de la connexion:', error);
    }
  }

  // Envoyer un message
  sendMessage(message: string, isPrivate: boolean = false, targetUserId?: string) {
    if (this.socket.connected) {
      const messageData = {
        message,
        isPrivate,
        targetUserId
      };
      console.log('📤 Envoi du message:', messageData);
      this.socket.emit('message', messageData);
    } else {
      console.warn('⚠️ Tentative d\'envoi de message sans connexion');
    }
  }

  // Se déconnecter du chat
  leaveChat(message?: string) {
    if (this.socket.connected) {
      console.log('👋 Déconnexion du chat');
      this.socket.emit('logout', message || 'Au revoir !');
    }
  }

  // Getters pour les observables
  getMessages() {
    return this.messages$.asObservable();
  }

  getUsers() {
    return this.users$.asObservable();
  }

  getUserResponse() {
    return this.userResponse$.asObservable();
  }

  getConnectionStatus() {
    return this.connected$.asObservable();
  }

  // Assigner un pseudo à un utilisateur
  assignPseudo(userId: string, pseudo: string) {
    if (this.socket.connected) {
      console.log('✏️ Assignment de pseudo:', { userId, pseudo });
      this.socket.emit('assignPseudo', { userId, pseudo });
    } else {
      console.warn('⚠️ Tentative d\'assignment de pseudo sans connexion');
    }
  }

  // Ajouter une note à un utilisateur
  addUserNote(userId: string, noteContent: string) {
    if (this.socket.connected) {
      console.log('📝 Ajout de note:', { userId, noteContent });
      this.socket.emit('addUserNote', { userId, noteContent });
    } else {
      console.warn('⚠️ Tentative d\'ajout de note sans connexion');
    }
  }

  // Obtenir l'ID de l'utilisateur courant
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  // Vérifier l'état de connexion
  isConnected(): boolean {
    return this.socket.connected;
  }
}
