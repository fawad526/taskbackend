import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Interface representing a Task item in DynamoDB
 */
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Class that handles task operations with DynamoDB
 */
class TaskService {
  private readonly dynamoDb: DynamoDB.DocumentClient;
  private readonly tableName: string;

  /**
   * Constructor initializes the DynamoDB client and table name
   * @param tableName The name of the DynamoDB table
   */
  constructor(tableName: string) {
    this.dynamoDb = new DynamoDB.DocumentClient();
    this.tableName = tableName;
  }

  /**
   * Fetches all tasks from the DynamoDB table
   * @returns Promise containing an array of Task objects
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: this.tableName
      };

      const result = await this.dynamoDb.scan(params).promise();
      return (result.Items as Task[]) || [];
    } catch (error) {
      console.error('Error fetching tasks from DynamoDB:', error);
      throw new Error('Failed to fetch tasks from database');
    }
  }
}

/**
 * Lambda handler function
 * @param event API Gateway proxy event
 * @returns API Gateway proxy result
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Initialize the task service with the table name from environment variable
    const tableName = process.env.TASKS_TABLE_NAME || 'TasksTable';
    const taskService = new TaskService(tableName);

    // Fetch all tasks
    const tasks = await taskService.getAllTasks();

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // For CORS support
      },
      body: JSON.stringify({
        success: true,
        data: tasks,
        count: tasks.length
      })
    };
  } catch (error) {
    console.error('Error in lambda handler:', error);

    // Return error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'An error occurred while retrieving tasks',
        error: (error as Error).message
      })
    };
  }
};