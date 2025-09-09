import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserComponent } from '../user/user';
import { ChatComponent } from '../chat-component/chat-component';

@Component({
  selector: 'app-main',
  imports: [CommonModule, UserComponent, ChatComponent],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class MainComponent {

}
