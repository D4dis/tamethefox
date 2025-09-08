import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat-component/chat-component';
import { Register } from './register/register';

export const routes: Routes = [
  {
    path: 'chat',
    component: ChatComponent
  },
  {
    path: '',
    component: Register,
    title: 'Tam The Fox'
  }
];
