import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const FUNCTION_NAME = "CreateTaskFunction";
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

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    logger.error("Invalid JSON in request body", { error: err.message, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  const { title, description, category } = body;
  const userId = process.env.AWS_SAM_LOCAL
    ? "mock-user-1234"
    : event?.requestContext?.authorizer?.claims?.sub;

  if (!userId || typeof title !== "string" || title.trim().length === 0) {
    logger.error("Missing or invalid fields", { title, userId, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid fields: title or userId" }),
    };
  }

  const taskId = uuidv4();
  const timestamp = new Date().toISOString();

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      userId,
      taskId,
      title: title.trim(),
      description,
      category,
      isCompleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  logger.info("Creating task", { taskId, userId, requestId });

  try {
    await docClient.send(command);
    logger.info("Task created successfully", { taskId, requestId });
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Task created", taskId }),
    };
  } catch (error) {
    logger.error("DynamoDB error", { error: error.message, requestId });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create task", errorDetails: error.message }),
    };
  }
};
