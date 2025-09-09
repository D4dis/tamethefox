export enum MessageType {
  NORMAL = 0,
  USER_JOIN = 1,
  USER_LEAVE = 2
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderEmote: string;
  senderDisplayName: string;
  recipientId?: string;  // Ajout pour les messages privés
  message: string;
  type: MessageType;
  timestamp: Date | string;
}
