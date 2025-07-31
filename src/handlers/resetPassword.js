import { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient();

export const handler = async (event) => {
  const stage = process.env.STAGE || "unknown";
  const requestId = event.requestContext?.requestId || "no-request-id";

  try {
    const body = JSON.parse(event.body);
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      console.warn(JSON.stringify({ level: "WARN", stage, requestId, message: "Missing fields", email, code }));
      return { statusCode: 400, body: JSON.stringify({ message: "Email, code, and new password are required." }) };
    }

    await client.send(new ConfirmForgotPasswordCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    }));

    console.log(JSON.stringify({ level: "INFO", stage, requestId, message: "Password reset successful", email }));
    return { statusCode: 200, body: JSON.stringify({ message: "Password reset successful." }) };
  } catch (err) {
    console.error(JSON.stringify({ level: "ERROR", stage, requestId, message: "ResetPassword failed", error: err.message }));
    return { statusCode: 500, body: JSON.stringify({ message: "Failed to reset password.", error: err.message }) };
  }
};
