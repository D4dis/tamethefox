import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ChatService } from '../services/chat.service';
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

  onSubmit(form: NgForm): void {
    const emoji = form.value.emoji;
    const username = this.generateRandomUsername(emoji);
    this.chatService.login(username);
    this.router.navigate(['/chat'], { state: { username } });
  }
}
