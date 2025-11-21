import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand
} from "@aws-sdk/lib-dynamodb";
import { ENV } from "../config/env";

const client = new DynamoDBClient({
  region: ENV.region,
  endpoint: ENV.isLocal ? "http://localhost:8000" : undefined
});

export const ddb = DynamoDBDocumentClient.from(client);

export const getUser = (userId: string) =>
  ddb.send(
    new GetCommand({
      TableName: "UserProfile",
      Key: { userId }
    })
  );

export const putUser = (item: any) =>
  ddb.send(
    new PutCommand({
      TableName: "UserProfile",
      Item: item
    })
  );
