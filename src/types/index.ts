export enum AIModel {
  CLAUDE = 'claude',
  GPT4 = 'gpt4',
  GEMINI = 'gemini',
  PERPLEXITY = 'perplexity'
}

export enum ImageModel {
  DALLE = 'dalle' // Placeholder - we only use Banana.dev but keeping for frontend compatibility
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface AIResponse {
  text: string;
  citations: Citation[];
  model: AIModel;
  timestamp: number;
}

export interface ImageResponse {
  imageUrl: string;
  prompt: string;
  model: ImageModel;
  timestamp: number;
}

export interface AskRequest {
  question: string;
  model: AIModel;
  userId?: string;
}

export interface UserPreferences {
  userId: string;
  defaultModel: AIModel;
  timestamp: number;
}

export interface LambdaResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Credentials': boolean;
  };
  body: string;
}