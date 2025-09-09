import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './register.html',
})
export class Register {
  private chatService = inject(ChatService);
  private router = inject(Router);

  private generateRandomUsername(emoji: string): string {
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${emoji} ${randomNumber}`;
  }

  chooseEmoji(emoji: string): void {
    const username = this.generateRandomUsername(emoji);
    console.log(username);
    this.chatService.login(username);
    this.router.navigate(['/main'], { state: { username } });
  }
}
