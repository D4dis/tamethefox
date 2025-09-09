import { Routes } from '@angular/router';
import { MainComponent } from './components/main/main';
import { Register } from './register/register';

export const routes: Routes = [
  {
    path: 'main',
    component: MainComponent
  },
  {
    path: '',
    component: Register,
    title: 'Tam The Fox'
  }
];
