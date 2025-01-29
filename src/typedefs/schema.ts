export const typeDefs = `#graphql
  type User {
    username: String
    email: String
    phoneNumber: String
  }

  type AuthTokens {
    idToken: String
    accessToken: String
    refreshToken: String
  }

  type AuthMessage {
    code: String
    message: String
  }

  union AuthPayload = AuthTokens | AuthMessage

  type Query {
    _empty: String
  }

  
  type Mutation {
    signup(
      username: String!
      password: String!
      email: String!
      phoneNumber: String
    ): User

    login(
      username: String!
      password: String!
    ): AuthPayload

    resendCode(
      username: String!
    ): AuthMessage

    verifyCode(
      username: String!
      code: String!
    ): AuthMessage

    refreshTokens(
      refreshToken: String!
    ): AuthTokens
  }
`;
