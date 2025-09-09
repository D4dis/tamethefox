import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { Chat } from './components/chat/chat';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Register,
    title: 'Tam The Fox'
  },
  {
    path: 'chat',
    component: Chat,
    title: 'Tam The Fox',
    canActivate: [authGuard]
  }
];
