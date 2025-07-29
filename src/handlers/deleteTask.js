import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const FUNCTION_NAME = "DeleteTaskFunction";
const logger = {
  info: (...args) => console.log(`[INFO] [${FUNCTION_NAME}]`, ...args),
  error: (...args) => console.error(`[ERROR] [${FUNCTION_NAME}]`, ...args),
};

const tableName = process.env.TABLE_NAME;

const clientOptions = {
  region: "ap-south-2",
};

if (process.env.AWS_SAM_LOCAL) {
  clientOptions.endpoint = "http://host.docker.internal:8000";
}

const dynamoClient = new DynamoDBClient(clientOptions);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  const requestId = event?.requestContext?.requestId || "local";
  logger.info("Received event", { requestId });

  const userId = process.env.AWS_SAM_LOCAL
    ? "mock-user-1234"
    : event?.requestContext?.authorizer?.claims?.sub;

  const taskId = event?.pathParameters?.taskId;

  if (!userId || typeof userId !== "string" || !taskId || typeof taskId !== "string") {
    logger.error("Missing or invalid userId/taskId", { userId, taskId, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid userId or taskId" }),
    };
  }

  const command = new DeleteCommand({
    TableName: tableName,
    Key: { userId, taskId },
  });

  logger.info("Deleting task", { userId, taskId, requestId });

  try {
    await docClient.send(command);
    logger.info("Task deleted", { taskId, requestId });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Task deleted", taskId }),
    };
  } catch (error) {
    logger.error("DynamoDB delete failed", { error: error.message, requestId });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete task", errorDetails: error.message }),
    };
  }
};
