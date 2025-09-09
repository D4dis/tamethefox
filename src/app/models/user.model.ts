export interface User {
  id: string;
  pseudo: string;
  emoji: string;
  number?: number;
  profile?: UserProfile;
  isOnline?: boolean;
}

export interface UserProfile {
  qualities: string[];
  feelings: string[];
  searches?: string[];
  shouldKnow?: string[];
}
