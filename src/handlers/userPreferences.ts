import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoService } from '../services/dynamoService';
import { UserPreferences, AIModel } from '../types';

const dynamoService = new DynamoService();

export const getHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return createResponse(400, { error: 'userId is required' });
    }

    const preferences = await dynamoService.getUserPreferences(userId);

    if (!preferences) {
      return createResponse(404, { error: 'User preferences not found' });
    }

    return createResponse(200, preferences);

  } catch (error) {
    console.error('Get preferences error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const saveHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    if (!data.userId || !data.defaultModel) {
      return createResponse(400, { 
        error: 'Missing required fields: userId and defaultModel' 
      });
    }

    const preferences: UserPreferences = {
      userId: data.userId,
      defaultModel: data.defaultModel as AIModel,
      timestamp: Date.now()
    };

    await dynamoService.saveUserPreferences(preferences);

    return createResponse(200, { message: 'Preferences saved successfully' });

  } catch (error) {
    console.error('Save preferences error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
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
