import { Question } from '@/data/questions';
import { SupabaseService } from '@/services/supabaseService';

export class QuestionService {
  private static instance: QuestionService;
  private questions: Question[] = [];
  private isLoaded = false;
  private loadingPromise: Promise<Question[]> | null = null;
  private supabaseService = SupabaseService.getInstance();

  private constructor() {}

  static getInstance(): QuestionService {
    if (!QuestionService.instance) {
      QuestionService.instance = new QuestionService();
    }
    return QuestionService.instance;
  }

  async loadQuestions(): Promise<Question[]> {
    if (this.isLoaded && this.questions.length > 0) {
      return this.questions;
    }

    // Prevent multiple simultaneous loads
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.performLoad();
    const result = await this.loadingPromise;
    this.loadingPromise = null;
    return result;
  }

  private async performLoad(): Promise<Question[]> {
    try {
      // Try to load from Supabase first
      this.questions = await this.supabaseService.getAllQuestions();
      this.isLoaded = true;
      return this.questions;
    } catch (error) {
      console.error('Failed to load questions from Supabase:', error);
      
      try {
        // Fallback to JSON file
        const response = await fetch('/questions.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.questions = await response.json();
        this.isLoaded = true;
        return this.questions;
      } catch (jsonError) {
        console.error('Failed to load questions from JSON:', jsonError);
        // Final fallback to local questions
        const { questions: localQuestions } = await import('@/data/questions');
        this.questions = localQuestions;
        this.isLoaded = true;
        return this.questions;
      }
    }
  }

  async getRandomQuestions(count: number = 20): Promise<Question[]> {
    try {
      // Try to get random questions directly from Supabase
      const randomQuestions = await this.supabaseService.getRandomQuestions(count);
      console.log('Loaded random questions from Supabase:', randomQuestions.length);
      return randomQuestions;
    } catch (error) {
      console.error('Failed to get random questions from Supabase:', error);
      // Fallback to local method
      const allQuestions = await this.loadQuestions();
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      console.log('Using fallback random questions:', shuffled.length);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    }
  }

  async getQuestionById(id: number): Promise<Question | undefined> {
    const allQuestions = await this.loadQuestions();
    return allQuestions.find(q => q.id === id);
  }

  async getAllQuestions(): Promise<Question[]> {
    return this.loadQuestions();
  }

  // Method to load questions from API (for future use)
  async loadQuestionsFromAPI(apiUrl: string): Promise<Question[]> {
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      this.questions = await response.json();
      this.isLoaded = true;
      return this.questions;
    } catch (error) {
      console.error('Failed to load questions from API:', error);
      throw error;
    }
  }

  // Method to refresh questions (useful for getting updated content)
  async refreshQuestions(): Promise<Question[]> {
    this.isLoaded = false;
    this.questions = [];
    return this.loadQuestions();
  }
}