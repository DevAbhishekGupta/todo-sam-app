import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const FUNCTION_NAME = "SignupFunction";
const logger = {
  info: (...args) => console.log(`[INFO] [${FUNCTION_NAME}]`, ...args),
  error: (...args) => console.error(`[ERROR] [${FUNCTION_NAME}]`, ...args),
};

const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-south-2" });

export const handler = async (event) => {
  const requestId = event?.requestContext?.requestId || "unknown";
  logger.info("Signup request received", { requestId });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    logger.error("Invalid JSON in request body", { requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  const { email, password } = body;

  if (!email || !password) {
    logger.error("Missing email or password", { requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email and password are required" }),
    };
  }

  const command = new SignUpCommand({
    ClientId: process.env.USER_POOL_CLIENT_ID,
    Username: email,
    Password: password,
  });

  try {
    const result = await cognitoClient.send(command);
    logger.info("Signup successful", { email, requestId });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Signup successful", userSub: result.UserSub }),
    };
  } catch (err) {
    logger.error("Signup failed", { error: err.message, email, requestId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
