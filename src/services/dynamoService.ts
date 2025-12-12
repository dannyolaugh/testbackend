import { DynamoDB } from 'aws-sdk';
import { UserPreferences } from '../types';

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE || '';

export class DynamoService {
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          userId: preferences.userId,
          timestamp: preferences.timestamp,
          defaultModel: preferences.defaultModel
        }
      }).promise();
    } catch (error) {
      console.error('DynamoDB save error:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const result = await dynamodb.query({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false, // Get most recent first
        Limit: 1
      }).promise();

      if (result.Items && result.Items.length > 0) {
        return result.Items[0] as UserPreferences;
      }

      return null;
    } catch (error) {
      console.error('DynamoDB get error:', error);
      throw new Error('Failed to get user preferences');
    }
  }
}
