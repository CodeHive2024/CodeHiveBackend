// import { resolvers } from "../src/resolvers"; // Import your resolvers
// import AWS from 'aws-sdk';
// import jwt from 'jsonwebtoken';

// // Mock AWS SDK
// jest.mock('aws-sdk', () => {
//   const mockCognito = {
//     signUp: jest.fn(),
//     initiateAuth: jest.fn(),
//     resendConfirmationCode: jest.fn(),
//     confirmSignUp: jest.fn(),
//   };

//   // Mock the `promise` method on the request object returned by AWS methods
//   mockCognito.signUp.mockReturnValue({
//     promise: jest.fn(),
//   });

//   mockCognito.initiateAuth.mockReturnValue({
//     promise: jest.fn(),
//   });

//   mockCognito.resendConfirmationCode.mockReturnValue({
//     promise: jest.fn(),
//   });

//   mockCognito.confirmSignUp.mockReturnValue({
//     promise: jest.fn(),
//   });

//   return {
//     CognitoIdentityServiceProvider: jest.fn(() => mockCognito),
//   };
// });

// const cognitoMock = new AWS.CognitoIdentityServiceProvider();

// describe("Resolvers", () => {

//   afterEach(() => {
//     jest.clearAllMocks(); // Clear mocks after each test to ensure clean state
//   });

//   describe("signup", () => {
//     it("should successfully sign up a user", async () => {
//       // Mock the resolved value for the promise() method
//       cognitoMock.signUp().promise.mockResolvedValue({
//         UserSub: "user123",
//       });

//       const result = await resolvers.Mutation.signup(null, {
//         username: "testuser",
//         password: "testpassword",
//         email: "test@example.com",
//         phoneNumber: "1234567890",
//       });

//       expect(result).toEqual({
//         username: "user123",
//         email: "test@example.com",
//         phoneNumber: "1234567890",
//       });
//       expect(cognitoMock.signUp).toHaveBeenCalledTimes(1);
//     });

//     it("should throw an error when sign up fails", async () => {
//       cognitoMock.signUp().promise.mockRejectedValue(new Error("SignUpError"));

//       await expect(
//         resolvers.Mutation.signup(null, {
//           username: "testuser",
//           password: "testpassword",
//           email: "test@example.com",
//           phoneNumber: "1234567890",
//         })
//       ).rejects.toThrowError("SignUpError");
//     });
//   });

//   describe("login", () => {
//     it("should successfully log in a user", async () => {
//       cognitoMock.initiateAuth().promise.mockResolvedValue({
//         AuthenticationResult: {
//           IdToken: "fake_id_token",
//           AccessToken: "fake_access_token",
//           RefreshToken: "fake_refresh_token",
//         },
//       });

//       jwt.decode = jest.fn().mockReturnValue({ user: "testuser" });

//       const result = await resolvers.Mutation.login(null, {
//         username: "testuser",
//         password: "testpassword",
//       });

//       expect(result).toEqual({
//         idToken: "fake_id_token",
//         accessToken: "fake_access_token",
//         refreshToken: "fake_refresh_token",
