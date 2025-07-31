import { CognitoIdentityProviderClient, ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient();

export const handler = async (event) => {
  const stage = process.env.STAGE || "unknown";
  const requestId = event.requestContext?.requestId || "no-request-id";

  try {
    const body = JSON.parse(event.body);
    const { email } = body;

    if (!email) {
      console.warn(JSON.stringify({ level: "WARN", stage, requestId, message: "Missing email" }));
      return { statusCode: 400, body: JSON.stringify({ message: "Email is required." }) };
    }

    await client.send(new ForgotPasswordCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: email,
    }));

    console.log(JSON.stringify({ level: "INFO", stage, requestId, message: "OTP sent", email }));
    return { statusCode: 200, body: JSON.stringify({ message: "OTP sent to email." }) };
  } catch (err) {
    console.error(JSON.stringify({ level: "ERROR", stage, requestId, message: "ForgotPassword failed", error: err.message }));
    return { statusCode: 500, body: JSON.stringify({ message: "Failed to send OTP.", error: err.message }) };
  }
};
