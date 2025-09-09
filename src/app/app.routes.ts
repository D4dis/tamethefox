import { Routes } from '@angular/router';
import { MainComponent } from './components/main/main';
import { Register } from './register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'main',
    component: MainComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    component: Register,
    title: 'Tam The Fox'
  }
];
