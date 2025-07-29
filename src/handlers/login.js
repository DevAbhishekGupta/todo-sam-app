import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const FUNCTION_NAME = "LoginFunction";
const logger = {
  info: (...args) => console.log(`[INFO] [${FUNCTION_NAME}]`, ...args),
  error: (...args) => console.error(`[ERROR] [${FUNCTION_NAME}]`, ...args),
};

const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-south-2" });

export const handler = async (event) => {
  const requestId = event?.requestContext?.requestId || "unknown";
  logger.info("Login request received", { requestId });

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

  const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  try {
    const result = await cognitoClient.send(command);
    logger.info("Login successful", { email, requestId });

    const { AccessToken, IdToken, RefreshToken } = result.AuthenticationResult;

    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken: AccessToken, idToken: IdToken, refreshToken: RefreshToken }),
    };
  } catch (err) {
    logger.error("Login failed", { error: err.message, email, requestId });
    return {
      statusCode: 401,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
