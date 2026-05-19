import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate text using a prompt template
   */
  async generateText(
    template: string,
    inputVariables: Record<string, any>,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    try {
      // Format the prompt with input variables
      let prompt = template;
      Object.entries(inputVariables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      });

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user' as const,
            content: prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      });

      // Extract and return the response content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from OpenAI API');
      }

      return content;
    } catch (error) {
      console.error('Error generating text with OpenAI:', error);
      throw new Error(
        `Failed to generate text: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Generate embeddings for the given text using OpenAI
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error generating embeddings with OpenAI:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Calculate similarity between two texts using embeddings
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.generateEmbeddings(text1),
        this.generateEmbeddings(text2),
      ]);

      // Calculate cosine similarity
      const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
      const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
      
      return dotProduct / (magnitude1 * magnitude2);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      throw new Error('Failed to calculate text similarity');
    }
  }
}

export const aiService = new AIService();
