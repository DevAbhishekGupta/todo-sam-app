import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const FUNCTION_NAME = "UpdateTaskFunction";
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

  const taskId = event?.pathParameters?.taskId;
  const userId = process.env.AWS_SAM_LOCAL
    ? "mock-user-1234"
    : event?.requestContext?.authorizer?.claims?.sub;

  if (!taskId || typeof taskId !== "string" || !userId || typeof userId !== "string") {
    logger.error("Missing or invalid userId/taskId", { userId, taskId, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid userId or taskId" }),
    };
  }

  const { title, description, category, isCompleted } = body;
  const timestamp = new Date().toISOString();

  let updateExp = "set updatedAt = :updatedAt";
  const expAttrVals = { ":updatedAt": timestamp };

  if (title !== undefined) {
    updateExp += ", title = :title";
    expAttrVals[":title"] = title;
  }
  if (description !== undefined) {
    updateExp += ", description = :description";
    expAttrVals[":description"] = description;
  }
  if (category !== undefined) {
    updateExp += ", category = :category";
    expAttrVals[":category"] = category;
  }
  if (isCompleted !== undefined) {
    updateExp += ", isCompleted = :isCompleted";
    expAttrVals[":isCompleted"] = isCompleted;
  }

  if (Object.keys(expAttrVals).length === 1) {
    logger.error("No fields to update", { requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No fields provided to update" }),
    };
  }

  const command = new UpdateCommand({
    TableName: tableName,
    Key: { userId, taskId },
    UpdateExpression: updateExp,
    ExpressionAttributeValues: expAttrVals,
    ReturnValues: "ALL_NEW",
  });

  logger.info("Updating task", { userId, taskId, updateExp, requestId });

  try {
    const result = await docClient.send(command);
    logger.info("Task updated", { taskId, updatedFields: Object.keys(expAttrVals), requestId });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Task updated", task: result.Attributes }),
    };
  } catch (error) {
    logger.error("DynamoDB update failed", { error: error.message, requestId });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update task", errorDetails: error.message }),
    };
  }
};
