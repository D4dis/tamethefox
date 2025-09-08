export interface ChatMessage {
  id: string;
  senderId: string;
  senderEmote: string;
  senderDisplayName: string; // emote ou pseudo assigné
  message: string;
  status: number; // 0: message normal, 1: nouvel utilisateur, 2: déconnexion
  timestamp: Date;
  type?: string; // 'join', 'leave', ou undefined pour message normal
  pseudo?: string;
}
