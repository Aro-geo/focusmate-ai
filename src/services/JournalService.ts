import { JournalEntry, NewJournalEntry } from '../models/JournalEntry';

/**
 * Service for journal entry-related operations (client-side)
 */
export const JournalService = {
  /**
   * Get all entries for a user
   */
  async getAllForUser(userId: number): Promise<JournalEntry[]> {
    // Mock data for client-side use
    return [
      {
        id: 1,
        user_id: userId,
        content: 'Started the day with clear goals and positive mindset. Completed morning meditation and planning session.',
        mood: 'optimistic',
        tags: ['morning', 'goals'],
        created_at: new Date()
      }
    ];
  },

  /**
   * Get entry by ID
   */
  async getById(id: number): Promise<JournalEntry | null> {
    const entries = await this.getAllForUser(1);
    return entries.find(entry => entry.id === id) || null;
  },

  /**
   * Create a new entry (mock implementation)
   */
  async create(entry: NewJournalEntry): Promise<JournalEntry> {
    // Mock implementation - in a real app, this would call an API
    const newEntry: JournalEntry = {
      id: Date.now(),
      user_id: entry.user_id,
      content: entry.content,
      mood: entry.mood || null,
      tags: entry.tags || [],
      created_at: new Date()
    };
    return newEntry;
  },

  /**
   * Update an entry (mock implementation)
   */
  async update(id: number, entry: Partial<JournalEntry>): Promise<JournalEntry | null> {
    // Mock implementation - in a real app, this would call an API
    const existingEntry = await this.getById(id);
    if (!existingEntry) return null;
    
    return {
      ...existingEntry,
      ...entry,
      id: existingEntry.id,
      created_at: existingEntry.created_at
    };
  },

  /**
   * Delete an entry (mock implementation)
   */
  async delete(id: number): Promise<boolean> {
    // Mock implementation - in a real app, this would call an API
    return true;
  },

  /**
   * Search journal entries by content or tags (mock implementation)
   */
  async search(userId: number, query: string): Promise<JournalEntry[]> {
    // Mock implementation - in a real app, this would call an API
    const allEntries = await this.getAllForUser(userId);
    return allEntries.filter(entry => 
      entry.content.toLowerCase().includes(query.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
};
