import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const FUNCTION_NAME = "CompleteTaskFunction";
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

  const taskId = event?.pathParameters?.taskId;
  const claims = event?.requestContext?.authorizer?.jwt?.claims || event?.requestContext?.authorizer?.claims;
  const userId = process.env.AWS_SAM_LOCAL
    ? "mock-user-1234"
    : claims?.sub;

  if (!taskId || typeof taskId !== "string" || !userId || typeof userId !== "string") {
    logger.error("Missing or invalid userId/taskId", { userId, taskId, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid userId or taskId" }),
    };
  }

  try {
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { userId, taskId },
    });

    const { Item } = await docClient.send(getCommand);

    if (!Item) {
      logger.error("Task not found", { taskId, requestId });
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Task not found" }),
      };
    }

    const newCompleted = !Item.isCompleted;
    const timestamp = new Date().toISOString();

    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { userId, taskId },
      UpdateExpression: "SET isCompleted = :isCompleted, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":isCompleted": newCompleted,
        ":updatedAt": timestamp,
      },
      ReturnValues: "ALL_NEW",
    });

    const { Attributes } = await docClient.send(updateCommand);

    logger.info("Task completion toggled", { taskId, newCompleted, requestId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Task completion toggled",
        task: Attributes,
      }),
    };
  } catch (error) {
    logger.error("DynamoDB error", { error: error.message, requestId });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Could not toggle completion",
        errorDetails: error.message,
      }),
    };
  }
};
