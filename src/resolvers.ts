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
  },
};
