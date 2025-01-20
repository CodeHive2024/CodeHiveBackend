export const typeDefs = `#graphql
  type User {
    username: String
    email: String
    phoneNumber: String
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
  }
`;
