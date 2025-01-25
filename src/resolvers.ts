import dotenv from "dotenv";
dotenv.config();
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import logger from "./utils/logger";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
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

      const signUpCommand = new SignUpCommand(params);

      try {
        const data = await cognitoClient.send(signUpCommand);
        logger.info(`User signed up successfully: ${data.UserSub}`, {
          requestId: "signup",
        });
        return {
          username: data.UserSub,
          email,
          phoneNumber: phoneNumber || "",
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error(`Error signing up user: ${username}: ${error.message}`);
          throw new Error(
            `Failed to sign up user: ${username}. Error: ${error.message}`
          );
        } else {
          logger.error(`Unexpected error signing up user: ${username}`);
          throw new Error(`Unexpected error occurred during sign up`);
        }
      }
    },

    login: async (_: any, { username, password }: any) => {
      const params = {
        AuthFlow: "USER_PASSWORD_AUTH" as AuthFlowType,
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      };

      const authCommand = new InitiateAuthCommand(params);

      try {
        const data = await cognitoClient.send(authCommand);
        const decoded = jwt.decode(data.AuthenticationResult?.IdToken!);
        logger.info(`User login successful: ${username}`);

        return {
          idToken: data.AuthenticationResult?.IdToken,
          accessToken: data.AuthenticationResult?.AccessToken,
          refreshToken: data.AuthenticationResult?.RefreshToken,
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name === "UserNotConfirmedException") {
            try {
              const resendCommand = new ResendConfirmationCodeCommand({
                ClientId: process.env.COGNITO_APP_CLIENT_ID!,
                Username: username,
              });

              await cognitoClient.send(resendCommand);
              logger.warn(
                `User ${username} not confirmed, verification code resent`
              );
              return {
                code: "USER_NOT_CONFIRMED",
                message:
                  "User not verified. A new verification code has been sent.",
              };
            } catch (resendError) {
              if (resendError instanceof Error) {
                logger.error(
                  `Failed to resend confirmation code to ${username}: ${resendError.message}`
                );
                throw new Error(
                  `Failed to resend confirmation code to ${username}. Error: ${resendError.message}`
                );
              } else {
                logger.error(
                  `Unexpected error resending confirmation code to ${username}`
                );
                throw new Error(
                  `Unexpected error occurred while resending code`
                );
              }
            }
          }

          logger.error(
            `Authentication failed for ${username}: ${error.message}`
          );
          throw new Error(
            `Authentication failed for ${username}. Error: ${error.message}`
          );
        } else {
          logger.error(`Unexpected error during login for ${username}`);
          throw new Error(`Unexpected error occurred during login`);
        }
      }
    },

    resendCode: async (_: any, { username }: any) => {
      const params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        Username: username,
      };

      const resendCommand = new ResendConfirmationCodeCommand(params);

      try {
        await cognitoClient.send(resendCommand);
        logger.info(`Verification code resent successfully to ${username}`);
        return {
          code: "SUCCESS",
          message: "Verification code resent successfully.",
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error(
            `Failed to resend verification code to ${username}: ${error.message}`
          );
          throw new Error(
            `Failed to resend verification code to ${username}. Error: ${error.message}`
          );
        } else {
          logger.error(`Unexpected error resending code to ${username}`);
          throw new Error(`Unexpected error occurred while resending code`);
        }
      }
    },

    verifyCode: async (_: any, { username, code }: any) => {
      const params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        Username: username,
        ConfirmationCode: code,
      };

      const confirmCommand = new ConfirmSignUpCommand(params);

      try {
        await cognitoClient.send(confirmCommand);
        logger.info(`User ${username} successfully verified`);
        return {
          code: "SUCCESS",
          message: "User successfully verified.",
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error(`Verification failed for ${username}: ${error.message}`);
          throw new Error(
            `Verification failed for ${username}. Error: ${error.message}`
          );
        } else {
          logger.error(`Unexpected error during verification for ${username}`);
          throw new Error(`Unexpected error occurred during verification`);
        }
      }
    },

    refreshTokens: async (_: any, { refreshToken }: any) => {
      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH" as AuthFlowType,
        ClientId: process.env.COGNITO_APP_CLIENT_ID!,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      const refreshTokenCommand = new InitiateAuthCommand(params);

      try {
        const data = await cognitoClient.send(refreshTokenCommand);
        logger.info("Tokens refreshed successfully");

        return {
          idToken: data.AuthenticationResult?.IdToken,
          accessToken: data.AuthenticationResult?.AccessToken,
          refreshToken: data.AuthenticationResult?.RefreshToken,
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error(`Failed to refresh tokens: ${error.message}`);
          throw new Error(`Failed to refresh tokens. Error: ${error.message}`);
        } else {
          logger.error(`Unexpected error while refreshing tokens`);
          throw new Error(`Unexpected error occurred while refreshing tokens`);
        }
      }
    },
  },
  AuthPayload: {
    __resolveType: (value: any) => {
      if (value.idToken) {
        return "AuthTokens";
      } else if (value.code) {
        return "AuthMessage";
      }
      return null;
    },
  },
};
