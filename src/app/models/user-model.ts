export interface User {
  id: string;
  emote: string;
  assignedPseudo?: string;
  assignedBy?: string;
  notes: UserNote[];
}

export interface UserNote {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
}