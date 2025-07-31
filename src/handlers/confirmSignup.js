import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient();

export const handler = async (event) => {
  const stage = process.env.STAGE || "unknown";
  const requestId = event.requestContext?.requestId || "no-request-id";

  console.log(JSON.stringify({
    level: "INFO",
    stage,
    requestId,
    message: "Received confirm signup request",
    body: event.body,
  }));

  try {
    const body = JSON.parse(event.body);
    const { email, code } = body;

    if (!email || !code) {
      console.warn(JSON.stringify({
        level: "WARN",
        stage,
        requestId,
        message: "Missing email or code in request",
        email,
        code,
      }));
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and confirmation code are required." }),
      };
    }

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    await client.send(command);

    console.log(JSON.stringify({
      level: "INFO",
      stage,
      requestId,
      message: "User confirmed successfully",
      email,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User confirmed successfully." }),
    };
  } catch (err) {
    console.error(JSON.stringify({
      level: "ERROR",
      stage,
      requestId,
      message: "ConfirmSignUp failed",
      error: err.message,
      stack: err.stack,
    }));

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to confirm user.", error: err.message }),
    };
  }
};
