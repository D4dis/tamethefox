import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../socket';

interface User {
  id: string;
  pseudo: string;
  emoji: string;
  profile?: { qualities: string[]; feelings: string[] };
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
})
export class UserComponent implements OnInit {
  users: User[] = [];
  currentUser: User | null = null;
  selectedUser: User | null = null;
  noteType: 'qualities' | 'feelings' = 'qualities';
  noteInput: string = '';

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.onConnected().subscribe((data) => {
      this.currentUser = { id: data.id, pseudo: data.pseudo, emoji: data.emoji };
    });

    this.socketService.onUserList().subscribe((users) => {
      this.users = users.filter((user) => user.id !== this.currentUser?.id);
    });

    this.socketService.onProfileUpdated().subscribe(({ userId, profile }) => {
      if (this.selectedUser?.id === userId) {
        this.selectedUser = { ...this.selectedUser, profile };
      }
      this.users = this.users.map((user) => (user.id === userId ? { ...user, profile } : user));
    });

    this.socketService.onProfileViewed().subscribe(({ message }) => {
      alert(message);
      this.currentUser = null;
      this.selectedUser = null;
      this.users = [];
    });

    this.socketService.onError().subscribe(({ message }) => {
      alert(message);
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.socketService.setSelectedUser(user.id);
  }

  tameUser(user: User): void {
    const newName = prompt(`Nouveau nom pour ${user.pseudo} :`, user.pseudo);
    if (newName) {
      this.socketService.tameUser(user.id, newName);
    }
  }

  addProfileNote(): void {
    if (this.noteInput && this.selectedUser) {
      this.socketService.addProfileNote(this.selectedUser.id, this.noteInput, this.noteType);
      this.noteInput = '';
    } else {
      alert('Veuillez sélectionner un utilisateur et entrer une note.');
    }
  }

  viewMyProfile(): void {
    this.socketService.viewMyProfile();
  }
}
