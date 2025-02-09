# CodeHiveBackend
The backend is currently split into graphql and socketio. We aren't setting up any traditional rest apis at the moment. You can research the conveniences of graphql. Socketio is being used for live transactions/feedback between the ui and backend.
## Local project setup
- Install dependencies
```
npm install
```
- Ask on discord for env file
```
npm run dev
```
Go to http://localhost:3001/graphql to see graphql console. Ask team members if they already have a collection of requests, so you don't have to start from scratch.

- To start local dbs
```
docker compose up
```

- To view neo4j data, install ne04j desktop.
- To view dynamo data, just go to localstack site - https://app.localstack.cloud/inst/default/resources.

## Compile to typescript
```
npm run build
```

## Run tests
```
npm test
```
