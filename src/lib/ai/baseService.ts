import { deepseekChat } from '../deepseek';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { DEFAULT_MODEL, TEMPERATURE, MAX_TOKENS } from './config';

export class AIService {
  private deepseekClient: typeof deepseekChat;

  constructor() {
    if (!process.env.DEEPSEEK_CHAT_API_KEY) {
      throw new Error('DEEPSEEK_CHAT_API_KEY is not set in environment variables');
    }

    if (!deepseekChat) {
      throw new Error('DeepSeek client is not properly initialized');
    }

    this.deepseekClient = deepseekChat;
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
    if (!this.deepseekClient) {
      throw new Error('DeepSeek client is not properly initialized');
    }

    try {
      // Format the prompt with input variables
      let prompt = template;
      Object.entries(inputVariables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      });

      // Call DeepSeek API
      const response = await this.deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user' as const,
            content: prompt,
          },
        ],
        temperature: options.temperature ?? TEMPERATURE.BALANCED,
        max_tokens: options.maxTokens ?? MAX_TOKENS.MEDIUM,
      });

      // Extract and return the response content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from DeepSeek API');
      }

      return content;
    } catch (error) {
      console.error('Error generating text with DeepSeek:', error);
      throw new Error(
        `Failed to generate text: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Generate embeddings for the given text
   * Note: DeepSeek doesn't currently support embeddings, so this is a placeholder
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    console.warn('Embeddings are not supported with DeepSeek. Returning empty array.');
    // Return a zero vector as a placeholder
    return new Array(1536).fill(0);
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
