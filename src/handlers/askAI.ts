import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AIService } from '../services/aiService';
import { AskRequest, LambdaResponse } from '../types';

const aiService = new AIService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request: AskRequest = JSON.parse(event.body);

    // Validate request
    if (!request.question || !request.model) {
      return createResponse(400, { 
        error: 'Missing required fields: question and model' 
      });
    }

    // Get AI response
    const response = await aiService.ask(request.question, request.model);

    return createResponse(200, response);

  } catch (error) {
    console.error('Handler error:', error);
    return createResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

function createResponse(statusCode: number, body: any): LambdaResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
}
