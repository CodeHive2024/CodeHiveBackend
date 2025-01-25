import dotenv from "dotenv";
dotenv.config();
console.log("here3", process.env.COGNITO_APP_CLIENT_ID); // Should print the value
console.log("here4", process.env.AWS_REGION);
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log("Server ready at", url);
}

startServer();

// import dotenv from "dotenv";
// dotenv.config();
// console.log("here3", process.env.COGNITO_APP_CLIENT_ID); // Should print the value
// console.log("here4", process.env.AWS_REGION);
// import { ApolloServer } from "@apollo/server";
// import { startStandaloneServer } from "@apollo/server/standalone";
// import { typeDefs } from "./schema.js";
// import { resolvers } from "./resolvers.js";
// // const server = new ApolloServer({
// //   typeDefs,
// //   resolvers,
// // });
// // const { url } = await startStandaloneServer(server, {
// //   listen: { port: process.env.PORT },
// // });
// // console.log("Server ready at port", process.env.PORT);
// async function startServer() {
//   const server = new ApolloServer({
//     typeDefs,
//     resolvers,
//   });

//   // Use process.env.PORT, which Elastic Beanstalk provides
//   const { url } = await startStandaloneServer(server, {
//     listen: { port: process.env.PORT || 4000 }, // Use process.env.PORT if available, fallback to 4000
//   });

//   console.log(`Server ready at ${url}`);
// }

// startServer();
