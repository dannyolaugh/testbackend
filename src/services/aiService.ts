import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModel, AIResponse, Citation, ImageModel, ImageResponse } from '../types';

export class AIService {
  private anthropic: Anthropic;
  private openai: OpenAI | null;
  private googleAI: GoogleGenerativeAI | null;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    // Only initialize if API key exists
    this.openai = process.env.OPENAI_API_KEY
        ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        : null;

    this.googleAI = process.env.GOOGLE_API_KEY
        ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
        : null;
  }

  async askClaude(question: string): Promise<AIResponse> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: question
        }]
      });

      const textContent = message.content.find(block => block.type === 'text');
      const text = textContent && 'text' in textContent ? textContent.text : '';

      const citations: Citation[] = this.extractCitations(text);

      return {
        text,
        citations,
        model: AIModel.CLAUDE,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to get response from Claude');
    }
  }

  async askGPT4(question: string): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Updated model name
        messages: [{
          role: 'user',
          content: question
        }],
        max_tokens: 1024
      });

      const text = completion.choices[0]?.message?.content || '';
      const citations: Citation[] = this.extractCitations(text);

      return {
        text,
        citations,
        model: AIModel.GPT4,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('GPT-4 API error:', error);
      throw new Error('Failed to get response from GPT-4');
    }
  }

  async askGemini(question: string): Promise<AIResponse> {
    if (!this.googleAI) {
      throw new Error('Google API key not configured');
    }

    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(question);
      const response = await result.response;
      const text = response.text();

      const citations: Citation[] = this.extractCitations(text);

      return {
        text,
        citations,
        model: AIModel.GEMINI,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response from Gemini');
    }
  }

  async askPerplexity(question: string): Promise<AIResponse> {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: question
          }],
          max_tokens: 150,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('Perplexity response status:', response.status);

      if (!response.ok) {
        console.error('Perplexity API error response:', responseText);
        throw new Error(`Perplexity API returned ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      const text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        console.error('No text in response:', data);
        throw new Error('Perplexity returned empty response');
      }

      // Convert Perplexity citations (array of strings) to Citation objects
      let citations: Citation[] = [];
      if (data.citations && Array.isArray(data.citations)) {
        citations = data.citations.map((url: string, index: number) => ({
          title: `Source ${index + 1}`,
          url: url
        }));
      } else {
        citations = this.extractCitations(text);
      }

      return {
        text,
        citations,
        model: AIModel.PERPLEXITY,
        timestamp: Date.now()
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Perplexity request timed out');
        throw new Error('Perplexity API request timed out');
      }
      console.error('Perplexity API error:', error);
      throw new Error('Failed to get response from Perplexity');
    }
  }

  async ask(question: string, model: AIModel): Promise<AIResponse> {
    switch (model) {
      case AIModel.CLAUDE:
        return this.askClaude(question);
      case AIModel.GPT4:
        return this.askGPT4(question);
      case AIModel.GEMINI:
        return this.askGemini(question);
      case AIModel.PERPLEXITY:
        return this.askPerplexity(question);
      default:
        throw new Error(`Unsupported AI model: ${model}`);
    }
  }

  // Image Generation Method - DALL-E 3
  async generateImage(prompt: string): Promise<ImageResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('🎨 Starting DALL-E 3 image generation');
      console.log('📝 Prompt:', prompt);

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      });

      // Check if response and data exist
      if (!response || !response.data || response.data.length === 0) {
        throw new Error('No image data returned from DALL-E 3');
      }

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E 3');
      }

      console.log('✅ DALL-E 3 image generated successfully');
      console.log('🖼️ Image URL:', imageUrl);

      return {
        imageUrl,
        prompt,
        model: ImageModel.DALLE,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('DALL-E 3 API error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
      }
      throw new Error('Failed to generate image with DALL-E 3');
    }
  }

  private extractCitations(text: string): Citation[] {
    const citations: Citation[] = [];

    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];

    urls.forEach((url, index) => {
      citations.push({
        title: `Source ${index + 1}`,
        url: url.replace(/[,.)]+$/, '')
      });
    });

    return citations;
  }
}