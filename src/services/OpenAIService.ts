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
   * Store AI interaction for analytics and history
   */
  private async storeInteraction(
    prompt: string, 
    response: string, 
    context: string, 
    source: string, 
    interactionType: string
  ): Promise<void> {
    try {
      // Get user ID from localStorage (if user is logged in)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user?.id) {
        await axios.post(`${this.apiUrl}/ai-interactions`, {
          user_id: user.id,
          prompt,
          response,
          context,
          source,
          interaction_type: interactionType
        });
      }
    } catch (error) {
      // Don't throw error for analytics - just log it
      console.warn('Failed to store AI interaction:', error);
    }
  }

  /**
   * Chat with AI assistant via proxy
   */
  async chat(message: string, context?: string): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a focus and productivity coach. Help users stay motivated, break down tasks, and maintain focus. Be encouraging, practical, and concise. Respond in 1-2 sentences.'
        },
        {
          role: 'user',
          content: context ? `Context: ${context}\n\nQuestion: ${message}` : message
        }
      ];

      return await this.callOpenAIProxy(
        messages,
        'chat',
        context || 'general_chat',
        { maxTokens: 150, temperature: 0.7 }
      );

    } catch (error) {
      console.error('AI chat error:', error);
      const fallbackResponse = "I'm having trouble connecting right now. Try taking a 5-minute break and then tackle your task with fresh focus!";
      return fallbackResponse;
    }
  }

  /**
   * Get focus suggestions via proxy
   */
  async getFocusSuggestions(currentTask: string, timeRemaining?: number, distractions?: string): Promise<string[]> {
    try {
      let prompt = `As a productivity coach, give 3 specific focus suggestions for this task: "${currentTask}"`;
      if (timeRemaining) prompt += ` (${timeRemaining} minutes remaining)`;
      if (distractions) prompt += `. Current distractions: ${distractions}`;
      prompt += '. Respond with exactly 3 actionable suggestions, one per line.';

      const messages = [
        {
          role: 'system',
          content: 'You are a focus and productivity coach. Provide exactly 3 specific, actionable suggestions to help users focus better. Each suggestion should be one clear sentence. Format as: 1. [suggestion]\n2. [suggestion]\n3. [suggestion]'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.callOpenAIProxy(
        messages,
        'focus_suggestions',
        `task:${currentTask}`,
        { maxTokens: 300, temperature: 0.7 }
      );

      // Parse suggestions from response
      const suggestions = response
        .split('\n')
        .filter(line => line.trim() && (line.includes('1.') || line.includes('2.') || line.includes('3.') || line.includes('-')))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        .slice(0, 3);

      // Fallback if parsing fails
      if (suggestions.length === 0) {
        suggestions.push(response.trim());
      }

      return suggestions;

    } catch (error) {
      console.error('Focus suggestions error:', error);
      return [
        "Break your task into smaller 15-minute chunks",
        "Remove distractions from your workspace",
        "Set a specific goal for this session"
      ];
    }
  }

  /**
   * Analyze journal entries via backend
   */
  async analyzeJournal(journalEntries: Array<{content: string, date: string}>): Promise<string> {
    try {
      const response = await axios.post<JournalAnalysisResponse>(`${this.apiUrl}/ai-journal-analysis`, {
        journalEntries
      });
      
      return response.data.insights;
    } catch (error) {
      console.error('Journal analysis error:', error);
      return "Your journal shows consistent effort toward your goals. Keep reflecting on your progress!";
    }
  }

  /**
   * Generate journal response (for Journal component)
   */
  async generateJournalResponse(entry: any): Promise<AIResponse> {
    try {
      const response = await axios.post<JournalAnalysisResponse>(`${this.apiUrl}/ai-journal-analysis`, {
        journalEntries: [entry]
      });
      
      return {
        insights: response.data.insights,
        message: response.data.insights,
        suggestions: response.data.suggestions || [
          "Continue reflecting on your daily experiences",
          "Set specific goals for tomorrow",
          "Celebrate your achievements, no matter how small"
        ]
      };
    } catch (error) {
      console.error('Journal response error:', error);
      return {
        insights: "Your reflection shows great self-awareness. Keep up the journaling habit!",
        message: "Your reflection shows great self-awareness. Keep up the journaling habit!",
        suggestions: [
          "Continue reflecting on your daily experiences",
          "Set specific goals for tomorrow",
          "Celebrate your achievements, no matter how small"
        ]
      };
    }
  }

  /**
   * Generate session summary (for PostSessionAnalytics component)
   */
  async generateSessionSummary(sessionData: any): Promise<AIResponse> {
    try {
      const response = await axios.post<SessionSummaryResponse>(`${this.apiUrl}/ai-session-summary`, {
        sessionData
      });
      
      return {
        insights: response.data.insights,
        summary: response.data.summary,
        suggestions: response.data.suggestions || []
      };
    } catch (error) {
      console.error('Session summary error:', error);
      return {
        insights: "Great work completing this session!",
        summary: "Great work completing this session!",
        suggestions: ["Take regular breaks", "Track your progress", "Stay consistent"]
      };
    }
  }

  /**
   * Generate Pomodoro reflection (for Pomodoro component)
   */
  async generatePomodoroReflection(sessionData: any): Promise<{ message: string }> {
    try {
      const response = await this.chat(
        `Reflect on this Pomodoro session: ${sessionData.duration} minutes, completed: ${sessionData.completed}, mood: ${sessionData.mood}`,
        "Pomodoro reflection"
      );
      return { message: response };
    } catch (error) {
      console.error('Pomodoro reflection error:', error);
      return { message: "Excellent work! Every focused session brings you closer to your goals." };
    }
  }

  /**
   * Get welcome message for new user signup
   */
  async getSignupWelcomeMessage(username: string): Promise<string> {
    try {
      const welcomePrompt = `Welcome ${username}! I'm FocusMate AI, your productivity assistant. Give me an encouraging welcome message for a new user.`;
      const response = await this.chat(welcomePrompt, "New user welcome");
      return response;
    } catch (error) {
      console.error('Welcome message error:', error);
      return `Welcome to FocusMate AI, ${username}! I'm here to help you stay focused and productive. Let's achieve great things together! 🚀`;
    }
  }

  /**
   * Check if AI service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/health`);
      return true;
    } catch (error) {
      console.error('AI service unavailable:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
export default openAIService;
