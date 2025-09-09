// user.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
})
export class UserComponent implements OnInit, OnDestroy {
  users: User[] = [];
  currentUser: User | null = null;
  selectedUser: User | null = null;
  noteType: 'qualities' | 'feelings' | 'searches' | 'shouldKnow' = 'qualities';
  noteInput: string = '';
  tamedUsers: Map<string, string> = new Map(); // userId -> tamedName
  unreadMessages: Set<string> = new Set(); // userId avec messages non lus
  private subscriptions: Subscription[] = [];

  // Statistiques pour l'humeur
  moodStats = {
    sunny: 0,
    cloudy: 0,
    question: 0
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // S'abonner à la connexion
    this.subscriptions.push(
      this.userService.onConnected().subscribe((data) => {
        this.currentUser = {
          id: data.id,
          pseudo: data.pseudo,
          emoji: data.emoji
        };
        console.log('Utilisateur connecté:', this.currentUser);
      })
    );

    // S'abonner à la liste des utilisateurs
    this.subscriptions.push(
      this.userService.onUserList().subscribe((users) => {
        // Filtrer l'utilisateur actuel et trier
        const filteredUsers = users.filter((user) => user.id !== this.currentUser?.id);
        this.sortUsers(filteredUsers);
        this.calculateMoodStats();
        console.log('Liste des utilisateurs mise à jour:', this.users);
      })
    );

    // S'abonner aux notifications de messages
    this.subscriptions.push(
      this.userService.onMessageNotification().subscribe(({ senderId }) => {
        // Ajouter l'expéditeur aux messages non lus si ce n'est pas l'utilisateur sélectionné
        if (senderId !== this.selectedUser?.id) {
          this.unreadMessages.add(senderId);
          // Forcer le rafraîchissement de l'affichage
          this.users = [...this.users];
        }
      })
    );

    // S'abonner aux mises à jour de profil
    this.subscriptions.push(
      this.userService.onProfileUpdated().subscribe(({ userId, profile }) => {
        // Mettre à jour le profil de l'utilisateur sélectionné
        if (this.selectedUser?.id === userId) {
          this.selectedUser = { ...this.selectedUser, profile };
        }

        // Mettre à jour dans la liste
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          this.users[userIndex] = { ...this.users[userIndex], profile };
        }
      })
    );

    // S'abonner à la réception du profil avant réinitialisation
    this.subscriptions.push(
      this.userService.onMyProfile().subscribe(({ profile, pseudo, emoji }) => {
        // Afficher le profil AVANT la réinitialisation
        let profileContent = `🦊 VOTRE PROFIL 🦊\n`;
        profileContent += `\nIdentité: ${pseudo} ${emoji}\n`;
        profileContent += `\n==================\n`;

        if (profile.qualities && profile.qualities.length > 0) {
          profileContent += `\n💎 Qualités:\n`;
          profile.qualities.forEach((q: string) => profileContent += `  • ${q}\n`);
        }

        if (profile.feelings && profile.feelings.length > 0) {
          profileContent += `\n❤️ Ressenti:\n`;
          profile.feelings.forEach((f: string) => profileContent += `  • ${f}\n`);
        }

        if (profile.searches && profile.searches.length > 0) {
          profileContent += `\n🔍 Recherche:\n`;
          profile.searches.forEach((s: string) => profileContent += `  • ${s}\n`);
        }

        if (profile.shouldKnow && profile.shouldKnow.length > 0) {
          profileContent += `\n💡 À savoir:\n`;
          profile.shouldKnow.forEach((k: string) => profileContent += `  • ${k}\n`);
        }

        if (!profile.qualities?.length && !profile.feelings?.length &&
          !profile.searches?.length && !profile.shouldKnow?.length) {
          profileContent += `\nVotre profil est vide. Personne n'a encore écrit sur vous.\n`;
        }

        profileContent += `\n==================\n`;
        profileContent += `\nVotre profil sera maintenant réinitialisé.\n`;

        // Afficher le profil
        alert(profileContent);
      })
    );

    // S'abonner à la visualisation du profil (réinitialisation)
    this.subscriptions.push(
      this.userService.onProfileViewed().subscribe(({ message }) => {
        console.log(message);
        // Réinitialiser tout
        this.selectedUser = null;
        this.tamedUsers.clear();
        this.unreadMessages.clear();
        // Ne pas réinitialiser currentUser, l'utilisateur reste connecté
      })
    );

    // S'abonner aux erreurs
    this.subscriptions.push(
      this.userService.onError().subscribe(({ message }) => {
        console.error('Erreur:', message);
        alert(`Erreur: ${message}`);
      })
    );

    // S'abonner aux apprivoisements
    this.subscriptions.push(
      this.userService.onUserTamed().subscribe(({ userId, tamedName }) => {
        this.tamedUsers.set(userId, tamedName);
        // Re-trier la liste pour placer l'utilisateur apprivoisé en haut
        this.sortUsers(this.users);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Trier les utilisateurs (apprivoisés en premier)
  private sortUsers(users: User[]): void {
    this.users = users.sort((a, b) => {
      const aTamed = this.tamedUsers.has(a.id);
      const bTamed = this.tamedUsers.has(b.id);

      // Les utilisateurs apprivoisés vont en premier
      if (aTamed && !bTamed) return -1;
      if (!aTamed && bTamed) return 1;

      // Sinon, garder l'ordre original
      return 0;
    });
  }

  // Calculer les statistiques d'humeur
  calculateMoodStats(): void {
    this.moodStats = {
      sunny: 0,
      cloudy: 0,
      question: 0
    };

    // Inclure l'utilisateur actuel dans les stats
    if (this.currentUser) {
      this.updateMoodStat(this.currentUser.emoji);
    }

    // Compter les autres utilisateurs
    this.users.forEach(user => {
      this.updateMoodStat(user.emoji);
    });
  }

  private updateMoodStat(emoji: string): void {
    if (emoji === '☀️') this.moodStats.sunny++;
    else if (emoji === '☁️') this.moodStats.cloudy++;
    else if (emoji === '❓') this.moodStats.question++;
  }

  // Obtenir le nom d'affichage d'un utilisateur
  getUserDisplayName(user: User): string {
    const tamedName = this.tamedUsers.get(user.id);
    return tamedName || user.pseudo;
  }

  // Sélectionner un utilisateur pour le chat
  selectUser(user: User): void {
    this.selectedUser = user;
    this.userService.setSelectedUser(user.id);

    // Marquer les messages comme lus
    this.unreadMessages.delete(user.id);

    console.log('Utilisateur sélectionné:', user);
  }

  // Apprivoiser un utilisateur
  tameUser(user: User): void {
    const currentName = this.tamedUsers.get(user.id) || user.pseudo;
    const newName = prompt(`Donner un nom à ${currentName}:`, currentName);

    if (newName && newName.trim()) {
      this.userService.tameUser(user.id, newName.trim());
      this.tamedUsers.set(user.id, newName.trim());
      // Re-trier pour placer en haut
      this.sortUsers(this.users);
    }
  }

  // Ajouter une note au profil
  addProfileNote(): void {
    if (!this.noteInput.trim() || !this.selectedUser) {
      alert('Veuillez sélectionner un utilisateur et entrer une note.');
      return;
    }

    this.userService.addProfileNote(
      this.selectedUser.id,
      this.noteInput.trim(),
      this.noteType
    );
    this.noteInput = '';
  }

  // Voir son propre profil
  viewMyProfile(): void {
    const confirmation = confirm(
      '⚠️ ATTENTION: Après avoir vu votre profil, il sera réinitialisé!\n\n' +
      '• Vous perdrez tous les utilisateurs apprivoisés\n' +
      '• Votre profil sera vidé\n' +
      '• Vous recevrez un nouveau numéro\n\n' +
      'Êtes-vous sûr de vouloir continuer?'
    );

    if (confirmation) {
      this.userService.viewMyProfile();
    }
  }

  // Changer d'humeur
  changeMood(): void {
    const moods = [
      { emoji: '☀️', name: 'Ensoleillé' },
      { emoji: '☁️', name: 'Nuageux' },
      { emoji: '❓', name: 'Question' }
    ];

    const currentMood = this.currentUser?.emoji || '❓';
    const options = moods
      .filter(m => m.emoji !== currentMood)
      .map(m => `${m.emoji} ${m.name}`)
      .join('\n');

    const choice = prompt(
      `Votre humeur actuelle: ${currentMood}\n\n` +
      `Choisissez votre nouvelle humeur:\n${options}\n\n` +
      `Entrez l'emoji (☀️, ☁️, ou ❓):`
    );

    if (choice && moods.some(m => m.emoji === choice)) {
      this.userService.changeMood(choice);
      if (this.currentUser) {
        this.currentUser.emoji = choice;
        this.calculateMoodStats();
      }
    }
  }

  // Obtenir la classe CSS pour un utilisateur
  getUserClass(user: User): string {
    let classes = 'user-item';

    if (this.selectedUser?.id === user.id) {
      classes += ' selected';
    }

    if (this.tamedUsers.has(user.id)) {
      classes += ' tamed';
    }

    if (this.unreadMessages.has(user.id)) {
      classes += ' has-unread';
    }

    return classes;
  }

  // Vérifier si un utilisateur a des messages non lus
  hasUnreadMessages(userId: string): boolean {
    return this.unreadMessages.has(userId);
  }

  // Getters pour éviter les erreurs undefined dans le template
  get selectedUserSearches(): string[] {
    return this.selectedUser?.profile?.searches || [];
  }

  get selectedUserShouldKnow(): string[] {
    return this.selectedUser?.profile?.shouldKnow || [];
  }
}
