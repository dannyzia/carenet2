/** Chat message in a conversation */
export interface ChatMessage {
  id: string;
  sender: "self" | "other";
  senderName?: string;
  text: string;
  time: string;
  read: boolean;
  attachment?: { type: "image" | "file"; url: string; name?: string };
}

/** Conversation thread summary */
export interface ConversationThread {
  id: string;
  contactName: string;
  contactRole: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  avatar?: string;
  online?: boolean;
}

/** Conversation item for messages list (used across roles) */
export interface ConversationItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  pinned?: boolean;
  /** Other participant's user ID (for filtering/creating conversations) */
  participantId?: string;
  /** Caregiving job ID if conversation is from a job (for filtering active vs inactive jobs) */
  jobId?: string;
}