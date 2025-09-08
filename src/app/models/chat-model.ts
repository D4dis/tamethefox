export interface ChatMessage {
  id: string;
  senderId: string;
  senderEmote: string;
  senderDisplayName: string; // emote ou pseudo assigné
  message: string;
  status: number; // 0: message normal, 1: nouvel utilisateur, 2: déconnexion
  isPrivate: boolean;
  targetUserId?: string; // pour les messages privés
  timestamp: Date;
}
