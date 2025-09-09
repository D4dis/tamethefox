import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { User } from '../models/user.model';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private selectedUserSubject = new BehaviorSubject<string | null>(null);
  selectedUser$ = this.selectedUserSubject.asObservable();

  constructor(private socketService: SocketService) {
    // Écouter les messages privés pour créer des notifications
    this.socketService.on('private-message').subscribe((message: any) => {
      // Émettre une notification si c'est un message reçu (pas envoyé)
      if (message.senderId !== this.socketService.getSocket().id) {
        this.emitMessageNotification(message.senderId);
      }
    });
  }

  // Observer la connexion
  onConnected(): Observable<{ id: string; pseudo: string; emoji: string; number?: number }> {
    return this.socketService.on<{ id: string; pseudo: string; emoji: string; number?: number }>('connected');
  }

  // Observer la liste des utilisateurs
  onUserList(): Observable<User[]> {
    return this.socketService.on<User[]>('user-list');
  }

  // Définir l'utilisateur sélectionné pour le chat
  setSelectedUser(userId: string | null): void {
    this.selectedUserSubject.next(userId);
  }

  // Obtenir l'utilisateur sélectionné
  getSelectedUser(): Observable<string | null> {
    return this.selectedUser$;
  }

  // Apprivoiser un utilisateur
  tameUser(userId: string, newName: string): void {
    this.socketService.emit('tame-user', { userId, newName });
  }

  // Observer l'apprivoisement
  onUserTamed(): Observable<{ userId: string; tamedName: string }> {
    return this.socketService.on('user-tamed');
  }

  // Ajouter une note au profil
  addProfileNote(userId: string, note: string, type: 'qualities' | 'feelings' | 'searches' | 'shouldKnow'): void {
    this.socketService.emit('add-profile-note', { userId, note, type });
  }

  // Observer les mises à jour de profil
  onProfileUpdated(): Observable<{
    userId: string;
    profile: {
      qualities: string[];
      feelings: string[];
      searches?: string[];
      shouldKnow?: string[];
    };
  }> {
    return this.socketService.on('profile-updated');
  }

  // Voir son propre profil
  viewMyProfile(): void {
    this.socketService.emit('view-my-profile');
  }

  // Observer son propre profil
  onMyProfile(): Observable<{
    profile: any;
    pseudo: string;
    emoji: string;
  }> {
    return this.socketService.on('my-profile');
  }

  // Observer la réinitialisation du profil
  onProfileViewed(): Observable<{ message: string }> {
    return this.socketService.on('profile-viewed');
  }

  // Observer les erreurs
  onError(): Observable<{ message: string }> {
    return this.socketService.on('error');
  }

  // Sélectionner une humeur (emoji)
  selectMood(emoji: string): void {
    this.socketService.emit('select-mood', emoji);
  }

  // Changer d'humeur
  changeMood(emoji: string): void {
    this.socketService.emit('change-mood', emoji);
  }

  // Demander la liste des utilisateurs
  requestUserList(): void {
    this.socketService.emit('get-users');
  }

  // Créer un Subject pour les notifications de messages
  private messageNotificationSubject = new BehaviorSubject<{ senderId: string } | null>(null);

  // Émettre une notification de message
  private emitMessageNotification(senderId: string): void {
    this.messageNotificationSubject.next({ senderId });
  }

  // Observer les notifications de messages
  onMessageNotification(): Observable<{ senderId: string }> {
    return new Observable(observer => {
      this.messageNotificationSubject.subscribe(notification => {
        if (notification) {
          observer.next(notification);
        }
      });
    });
  }
}
