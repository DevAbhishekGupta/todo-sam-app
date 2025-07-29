import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const FUNCTION_NAME = "GetTasksFunction";
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

console.log("tableName: ", tableName);
console.log("Clientoptions:", clientOptions);

const dynamoClient = new DynamoDBClient(clientOptions);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  const requestId = event?.requestContext?.requestId || "local";
  logger.info("Received event", { requestId });

  const userId = process.env.AWS_SAM_LOCAL
    ? "mock-user-1234"
    : event?.requestContext?.authorizer?.claims?.sub;

  if (!userId || typeof userId !== "string") {
    logger.error("Missing or invalid userId", { userId, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid userId" }),
    };
  }

  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  });

  logger.info("Querying tasks", { userId, requestId });

  try {
    const result = await docClient.send(command);
    logger.info("Tasks fetched", { count: result.Items.length, requestId });
    return {
      statusCode: 200,
      body: JSON.stringify({ tasks: result.Items }),
    };
  } catch (error) {
    logger.error("DynamoDB query failed", { error: error.message, requestId });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not fetch tasks", errorDetails: error.message }),
    };
  }
};
