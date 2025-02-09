import dotenv from "dotenv";
dotenv.config();
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommand,
  AuthFlowType,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger";
import runNeo4jAction from "../../config/neo4j";
import { Session } from "neo4j-driver";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const signup = async (
  _: any,
  { username, firstName, lastName, password }: any
) => {
  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID!,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: username },
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
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
      firstName,
      lastName,
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
};

export const login = async (_: any, { username, password }: any) => {
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
            throw new Error(`Unexpected error occurred while resending code`);
          }
        }
      }

      logger.error(`Authentication failed for ${username}: ${error.message}`);
      throw new Error(
        `Authentication failed for ${username}. Error: ${error.message}`
      );
    } else {
      logger.error(`Unexpected error during login for ${username}`);
      throw new Error(`Unexpected error occurred during login`);
    }
  }
};

export const resendCode = async (_: any, { username }: any) => {
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
};

export const verifyCode = async (_: any, { username, code }: any) => {
  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID!,
    Username: username,
    ConfirmationCode: code,
  };

  const confirmCommand = new ConfirmSignUpCommand(params);

  try {
    const getUserParams = {
      UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
      Username: username,
    };

    const getUserCommand = new AdminGetUserCommand(getUserParams);
    const userData = await cognitoClient.send(getUserCommand);

    await cognitoClient.send(confirmCommand);
    logger.info(`User ${username} successfully verified`);

    // Extract firstName and lastName from user attributes
    const firstName = userData.UserAttributes?.find(
      (attr) => attr.Name === "given_name"
    )?.Value as string;
    const lastName = userData.UserAttributes?.find(
      (attr) => attr.Name === "family_name"
    )?.Value as string;

    await registerUserInNeo4j({ username, firstName, lastName });
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
};

export const refreshTokens = async (_: any, { refreshToken }: any) => {
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
};

const registerUserInNeo4j = async ({
  username,
  firstName,
  lastName,
}: {
  username: string;
  firstName: string;
  lastName: string;
}) => {
  const action = async (session: Session) => {
    const result = await session.run(
      `CREATE (u:User {username: $username, firstName: $firstName, lastName: $lastName}) RETURN u`,
      { username, firstName, lastName }
    );
  };

  const createdUserNode = await runNeo4jAction(action);
  console.log("Created User Node:", createdUserNode);
};
