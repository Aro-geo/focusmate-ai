import BaseApiService from './BaseApiService';

interface ChatResponse {
  response: string;
  source: 'openai' | 'fallback';
  interactionId?: string;
}

interface FocusSuggestionsResponse {
  suggestions: string[];
  source: 'openai' | 'fallback';
}

interface JournalAnalysisResponse {
  insights: string;
  suggestions: string[];
  source: 'openai' | 'fallback';
}

interface SessionSummaryResponse {
  summary: string;
  insights: string;
  suggestions: string[];
  source: 'openai' | 'fallback';
}

// Updated AIResponse interface to match component expectations
export interface AIResponse {
  insights: string;
  suggestions: string[];
  message?: string;  // Added for Journal component compatibility
  summary?: string;  // Added for PostSessionAnalytics component compatibility
  mood?: string;
  productivity?: number;
  source?: string;
}

interface OpenAIProxyResponse {
  success: boolean;
  response?: string;
  message?: string;
  source?: string;
  interactionType?: string;
  timestamp?: string;
  interactionId?: string;
  usage?: {
    tokens: number;
    model: string;
  };
}

class OpenAIService {
  /**
   * Call OpenAI via the centralized proxy function
   */
  private async callOpenAIProxy(
    messages: Array<{role: string, content: string}>,
    interactionType: string,
    context?: string,
    options?: any
  ): Promise<string> {
    const result = await BaseApiService.post<OpenAIProxyResponse>('openai-proxy', {
      messages,
      interactionType,
      context,
      options
    });

    if (result.success && result.data?.response) {
      return result.data.response;
    } else {
      throw new Error(result.message || 'OpenAI proxy request failed');
    }
  }

  /**
   * General chat with AI
   */
  async chat(prompt: string, context?: string): Promise<ChatResponse> {
    try {
      const messages = [
        { 
          role: 'user', 
          content: context ? `Context: ${context}\n\nUser: ${prompt}` : prompt 
        }
      ];

      const response = await this.callOpenAIProxy(
        messages,
        'chat',
        context
      );

      return {
        response,
        source: 'openai'
      };
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback response
      return {
        response: "I'm having trouble connecting right now. Please try again later.",
        source: 'fallback'
      };
    }
  }

  /**
   * Get AI-powered focus suggestions
   */
  async getFocusSuggestions(currentTasks: any[], userPreferences?: any): Promise<FocusSuggestionsResponse> {
    try {
      const context = {
        currentTasks,
        userPreferences,
        timestamp: new Date().toISOString()
      };

      const prompt = `Based on the user's current tasks and preferences, suggest 3-5 focus strategies or techniques that would be most effective. Consider task complexity, time available, and energy levels.

Current tasks: ${JSON.stringify(currentTasks)}
User preferences: ${JSON.stringify(userPreferences)}

Provide practical, actionable suggestions.`;

      const messages = [{ role: 'user', content: prompt }];

      const response = await this.callOpenAIProxy(
        messages,
        'focus_suggestions',
        JSON.stringify(context)
      );

      // Parse the response to extract suggestions
      const suggestions = response.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(suggestion => suggestion.length > 0);

      return {
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
        source: 'openai'
      };
    } catch (error) {
      console.error('Focus suggestions error:', error);
      return {
        suggestions: [
          "Try the Pomodoro Technique: 25 minutes focused work, 5 minute break",
          "Start with your most important task while your energy is high",
          "Minimize distractions by turning off notifications",
          "Break large tasks into smaller, manageable chunks",
          "Use time-blocking to dedicate specific periods to different activities"
        ],
        source: 'fallback'
      };
    }
  }

  /**
   * Analyze journal entries and provide insights
   */
  async analyzeJournal(entries: string[], timeframe: string = 'recent'): Promise<JournalAnalysisResponse> {
    try {
      const context = {
        timeframe,
        entryCount: entries.length,
        timestamp: new Date().toISOString()
      };

      const prompt = `Analyze these journal entries and provide insights about productivity patterns, mood trends, and suggestions for improvement:

${entries.map((entry, index) => `Entry ${index + 1}: ${entry}`).join('\n\n')}

Please provide:
1. Key insights about productivity and mood patterns
2. Practical suggestions for improvement
3. Any concerning patterns that need attention

Keep the analysis supportive and constructive.`;

      const messages = [{ role: 'user', content: prompt }];

      const response = await this.callOpenAIProxy(
        messages,
        'journal_analysis',
        JSON.stringify(context)
      );

      // Split response into insights and suggestions
      const parts = response.split(/(?:suggestions?|recommendations?)/i);
      const insights = parts[0]?.trim() || response;
      const suggestionsText = parts[1]?.trim() || '';
      
      const suggestions = suggestionsText.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(suggestion => suggestion.length > 0)
        .slice(0, 5);

      return {
        insights,
        suggestions: suggestions.length > 0 ? suggestions : [
          "Continue regular journaling to track patterns",
          "Focus on maintaining positive momentum",
          "Consider setting specific goals for improvement"
        ],
        source: 'openai'
      };
    } catch (error) {
      console.error('Journal analysis error:', error);
      return {
        insights: "Your journal entries show consistent engagement with self-reflection. This is a valuable habit for personal growth and productivity improvement.",
        suggestions: [
          "Continue regular journaling to track patterns",
          "Try writing at the same time each day",
          "Include specific goals and outcomes in your entries",
          "Review past entries weekly to identify trends"
        ],
        source: 'fallback'
      };
    }
  }

  /**
   * Generate session summary and insights
   */
  async generateSessionSummary(
    sessionData: any,
    tasksCompleted: any[],
    journalEntry?: string
  ): Promise<SessionSummaryResponse> {
    try {
      const context = {
        sessionData,
        tasksCompleted,
        hasJournalEntry: !!journalEntry,
        timestamp: new Date().toISOString()
      };

      const prompt = `Analyze this focus session and provide a summary with insights:

Session Details:
- Duration: ${sessionData.duration || 'N/A'} minutes
- Type: ${sessionData.type || 'Focus session'}
- Tasks completed: ${tasksCompleted.length}
${tasksCompleted.map(task => `  - ${task.title || task.name}`).join('\n')}
${journalEntry ? `\nJournal reflection: ${journalEntry}` : ''}

Provide:
1. A brief summary of the session
2. Key insights about productivity and focus
3. Suggestions for future sessions

Keep it encouraging and actionable.`;

      const messages = [{ role: 'user', content: prompt }];

      const response = await this.callOpenAIProxy(
        messages,
        'session_summary',
        JSON.stringify(context)
      );

      // Parse the response
      const sections = response.split(/(?:insights?|suggestions?)/i);
      const summary = sections[0]?.trim() || response;
      const insights = sections[1]?.trim() || '';
      const suggestionsText = sections[2]?.trim() || sections[1]?.trim() || '';
      
      const suggestions = suggestionsText.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(suggestion => suggestion.length > 0)
        .slice(0, 3);

      return {
        summary,
        insights: insights || "You maintained good focus during this session.",
        suggestions: suggestions.length > 0 ? suggestions : [
          "Consider taking a short break before your next session",
          "Review what worked well and apply it next time",
          "Set clear goals for your next focus session"
        ],
        source: 'openai'
      };
    } catch (error) {
      console.error('Session summary error:', error);
      return {
        summary: `You completed a productive ${sessionData.duration || 25}-minute focus session with ${tasksCompleted.length} tasks completed.`,
        insights: "You demonstrated good focus and task completion during this session.",
        suggestions: [
          "Take a well-deserved break",
          "Reflect on what helped you stay focused",
          "Plan your next session based on today's success"
        ],
        source: 'fallback'
      };
    }
  }

  /**
   * Stream chat response (for real-time interaction)
   */
  async streamChat(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: string
  ): Promise<void> {
    try {
      // For now, we'll simulate streaming by sending the full response
      // In the future, this could be enhanced with actual streaming
      const response = await this.chat(prompt, context);
      
      // Simulate streaming by sending chunks
      const words = response.response.split(' ');
      for (let i = 0; i < words.length; i++) {
        setTimeout(() => {
          onChunk(words[i] + ' ');
        }, i * 50); // 50ms delay between words
      }
    } catch (error) {
      console.error('Stream chat error:', error);
      onChunk("I'm having trouble connecting right now. Please try again later.");
    }
  }

  /**
   * Check if AI services are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await BaseApiService.get('health');
      return true;
    } catch (error) {
      console.error('AI service availability check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new OpenAIService();
