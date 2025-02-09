import resolvers from "../../src/graphql/auth/authResolver";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import logger from "../../src/utils/logger";

// Mock AWS SDK
jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const originalModule = jest.requireActual(
    "@aws-sdk/client-cognito-identity-provider"
  );
  return {
    ...originalModule,
    CognitoIdentityProviderClient: jest.fn(),
  };
});

// Mock logger
jest.mock("../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock jwt.decode
jest.mock("jsonwebtoken", () => ({
  decode: jest.fn(),
}));

// Mock Cognito Client
const mockSend = jest.fn();
CognitoIdentityProviderClient.prototype.send = mockSend;

describe("Resolvers Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should log in successfully", async () => {
      const mockAuthResponse = {
        AuthenticationResult: {
          IdToken: "idToken",
          AccessToken: "accessToken",
          RefreshToken: "refreshToken",
        },
      };
      mockSend.mockResolvedValueOnce(mockAuthResponse);

      // Mock the jwt.decode method to return a mock decoded token
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        sub: "12345", // You can mock this to match the token's payload structure
      });

      const result = await resolvers.Mutation.login(null, {
        username: "test@example.com",
        password: "Password123!",
      });

      expect(result).toEqual({
        idToken: "idToken",
        accessToken: "accessToken",
        refreshToken: "refreshToken",
      });

      expect(logger.info).toHaveBeenCalledWith(
        "User login successful: test@example.com"
      );
    });
  });
});
