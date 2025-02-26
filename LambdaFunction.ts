import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';


interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}


class TaskService {
  private readonly dynamoDb: DynamoDB.DocumentClient;
  private readonly tableName: string;

  
  constructor(tableName: string) {
    this.dynamoDb = new DynamoDB.DocumentClient();
    this.tableName = tableName;
  }


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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    
    const tableName = process.env.TASKS_TABLE_NAME || 'TasksTable';
    const taskService = new TaskService(tableName);

    // Fetch all tasks
    const tasks = await taskService.getAllTasks();

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({
        success: true,
        data: tasks,
        count: tasks.length
      })
    };
  } catch (error) {
    console.error('Error in lambda handler:', error);

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