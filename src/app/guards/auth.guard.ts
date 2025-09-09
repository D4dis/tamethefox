import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ChatService } from '../services/chat.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const chatService = inject(ChatService);

  if (chatService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};