import neo4j, { Session } from "neo4j-driver";
import logger from "../utils/logger";

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "password")
);

type Neo4jAction = (session: Session) => Promise<any>;

const runNeo4jAction = async (action: Neo4jAction) => {
  const session = driver.session();

  try {
    // Execute the provided action (query or operation)
    return await action(session);
  } catch (error) {
    logger.error("Error executing action in Neo4j:", error);
    throw error; // Re-throw the error to let the caller handle it
  } finally {
    // Close the session to free up resources
    await session.close();
  }
};

export default runNeo4jAction;
