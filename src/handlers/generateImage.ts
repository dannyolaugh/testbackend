import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AIService } from '../services/aiService';
import { LambdaResponse } from '../types';

const aiService = new AIService();

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('Received generateImage event:', JSON.stringify(event, null, 2));

    try {
        // Parse request body
        if (!event.body) {
            return createResponse(400, { error: 'Request body is required' });
        }

        const request = JSON.parse(event.body);

        // Validate request
        if (!request.prompt) {
            return createResponse(400, {
                error: 'Missing required field: prompt'
            });
        }

        console.log(`Generating image with GPT Image 1, prompt: ${request.prompt}`);

        // Generate image using GPT Image 1
        const response = await aiService.generateImage(request.prompt);

        console.log('Image generated successfully with GPT Image 1');

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