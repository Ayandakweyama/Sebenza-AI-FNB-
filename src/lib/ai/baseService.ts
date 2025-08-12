import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { DEFAULT_MODEL, TEMPERATURE, MAX_TOKENS } from './config';

export class AIService {
  private model: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      temperature: TEMPERATURE.BALANCED,
      maxTokens: MAX_TOKENS.MEDIUM,
      verbose: process.env.NODE_ENV === 'development',
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
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
      const prompt = ChatPromptTemplate.fromTemplate(template);
      const outputParser = new StringOutputParser();
      
      const chain = RunnableSequence.from([
        prompt,
        this.model,
        outputParser,
      ]);

      const result = await chain.invoke({
        ...inputVariables,
        format_instructions: outputParser.getFormatInstructions(),
      });

      return result;
    } catch (error) {
      console.error('Error in generateText:', error);
      throw new Error('Failed to generate text');
    }
  }

  /**
   * Generate embeddings for a text
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const result = await this.embeddings.embedQuery(text);
      return result;
    } catch (error) {
      console.error('Error generating embeddings:', error);
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
