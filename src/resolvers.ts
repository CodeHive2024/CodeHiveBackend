import dotenv from "dotenv";
dotenv.config(); // Ensure environment variables are loaded before using them
import AWS from "aws-sdk";

console.log("isfar", process.env.AWS_REGION);
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION, // e.g., 'us-west-2'
});

export const resolvers = {
  Mutation: {
    signup: async (_: any, { username, password, email, phoneNumber }: any) => {
      console.log("isfar2", process.env.AWS_REGION);

      const params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID!, // Your App Client ID from Cognito
        Username: username,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "phone_number", Value: phoneNumber || "" }, // Optional
        ],
      };

      try {
        // Sign up the user with Cognito
        const data = await cognito.signUp(params).promise();
        return {
          username: data.UserSub, // Return Cognito's unique user identifier
          email,
          phoneNumber: phoneNumber || "",
        };
      } catch (error) {
        throw new Error(JSON.stringify(error));
      }
    },
    login: async (_: any, { username, password }: any) => {
      const params: AWS.CognitoIdentityServiceProvider.InitiateAuthRequest = {
        AuthFlow: "USER_PASSWORD_AUTH", // Authentication flow type for username/password login
        ClientId: process.env.COGNITO_APP_CLIENT_ID!, // App Client ID from Cognito
        AuthParameters: {
          USERNAME: username, // The username passed from the client
          PASSWORD: password, // The password passed from the client
        },
      };

      try {
        // Authenticate user with Cognito
        const data = await cognito.initiateAuth(params).promise();

        // Return the tokens if authentication is successful
        return {
          idToken: data.AuthenticationResult?.IdToken,
          accessToken: data.AuthenticationResult?.AccessToken,
          refreshToken: data.AuthenticationResult?.RefreshToken,
        };
      } catch (error) {
        console.error("Authentication failed:", error);
        throw new Error("Authentication failed: " + JSON.stringify(error));
      }
    },
  },
};
