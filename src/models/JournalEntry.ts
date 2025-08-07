/**
 * Journal entry model interfaces
 */

export interface JournalEntry {
  id: number;
  user_id: number;
  content: string;
  mood?: string;
  tags?: string[];
  created_at: Date;
}

export interface NewJournalEntry {
  user_id: number;
  content: string;
  mood?: string;
  tags?: string[];
}
