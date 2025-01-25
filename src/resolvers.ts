import dotenv from "dotenv";
dotenv.config(); // Ensure environment variables are loaded before using them
import AWS from "aws-sdk";
import jwt from "jsonwebtoken";

console.log("isfar", process.env.AWS_REGION);
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION, // e.g., 'us-west-2'
});

export const resolvers = {
  Mutation: {
    signup: async (_: any, { username, password, email, phoneNumber }: any) => {
      const params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        Username: username,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "phone_number", Value: phoneNumber || "" },
        ],
      };

      try {
        const data = await cognito.signUp(params).promise();
        return {
          username: data.UserSub,
          email,
          phoneNumber: phoneNumber || "",
        };
      } catch (error) {
        throw new Error(JSON.stringify(error));
      }
    },
    login: async (_: any, { username, password }: any) => {
      const params: AWS.CognitoIdentityServiceProvider.InitiateAuthRequest = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      };

      try {
        // Attempt to authenticate the user
        const data = await cognito.initiateAuth(params).promise();
        const decoded = jwt.decode(data.AuthenticationResult?.IdToken!);
        console.log(
          "encoded",
          data.AuthenticationResult?.IdToken!,
          "decoded",
          decoded
        );
        // If successful, return tokens
        return {
          idToken: data.AuthenticationResult?.IdToken,
          accessToken: data.AuthenticationResult?.AccessToken,
          refreshToken: data.AuthenticationResult?.RefreshToken,
        };
      } catch (error: any) {
        // Check if the error is due to unverified user
        if (error.code === "UserNotConfirmedException") {
          try {
            // Resend the verification code
            await cognito
              .resendConfirmationCode({
                ClientId: process.env.COGNITO_APP_CLIENT_ID!,
                Username: username,
              })
              .promise();

            // Return a specific message or code to indicate unverified user
            return {
              code: "USER_NOT_CONFIRMED",
              message:
                "User not verified. A new verification code has been sent.",
            };
          } catch (resendError) {
            throw new Error(
              "Failed to resend verification code: " +
                JSON.stringify(resendError)
            );
          }
        }

        // For other errors, rethrow the error
        console.error("Authentication failed:", error);
        throw new Error("Authentication failed: " + JSON.stringify(error));
      }
    },
    resendCode: async (_: any, { username }: any) => {
      const params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        Username: username,
      };

      try {
        await cognito.resendConfirmationCode(params).promise();
        return {
          code: "SUCCESS",
          message: "Verification code resent successfully.",
        };
      } catch (error) {
        console.error("Failed to resend code:", error);
        return {
          code: "ERROR",
          message: "Failed to resend code: " + JSON.stringify(error),
        };
      }
    },
    verifyCode: async (_: any, { username, code }: any) => {
      const params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        Username: username,
        ConfirmationCode: code,
      };

      try {
        await cognito.confirmSignUp(params).promise();
        return {
          code: "SUCCESS",
          message: "User successfully verified.",
        };
      } catch (error) {
        console.error("Verification failed:", error);
        return {
          code: "ERROR",
          message: "Verification failed: " + JSON.stringify(error),
        };
      }
    },
    refreshTokens: async (_: any, { refreshToken }: any) => {
      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      try {
        // Attempt to refresh the tokens using the refresh token
        const data = await cognito.initiateAuth(params).promise();

        // Return new tokens
        return {
          idToken: data.AuthenticationResult?.IdToken,
          accessToken: data.AuthenticationResult?.AccessToken,
          refreshToken: data.AuthenticationResult?.RefreshToken, // Cognito may return a new refresh token
        };
      } catch (error) {
        console.error("Failed to refresh tokens:", error);
        throw new Error("Failed to refresh tokens: " + JSON.stringify(error));
      }
    },
  },
  AuthPayload: {
    __resolveType: (value: any) => {
      if (value.idToken) {
        return "AuthTokens"; // This means it's returning an AuthTokens type
      } else if (value.code) {
        return "AuthMessage"; // This means it's returning an AuthMessage type
      }
      return null; // Or you can throw an error if you expect only those two types
    },
  },
};
