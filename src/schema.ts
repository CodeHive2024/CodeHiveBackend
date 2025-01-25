export const typeDefs = `#graphql
  type User {
    username: String
    email: String
    phoneNumber: String
  }

  type AuthPayload {
    idToken: String
    accessToken: String
    refreshToken: String
  }

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
  }
`;
