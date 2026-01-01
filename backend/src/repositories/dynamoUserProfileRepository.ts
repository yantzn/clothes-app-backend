import { ddb } from "../lib/dynamo";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { UserProfile } from "../models/profile";
import type { UserProfileRepository } from "./userProfileRepository";

const TABLE_NAME = "UserProfile";

export class DynamoUserProfileRepository implements UserProfileRepository {
  async put(profile: UserProfile): Promise<void> {
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: profile,
        ConditionExpression: "attribute_not_exists(#pk)",
        ExpressionAttributeNames: { "#pk": "userId" }
      })
    );
  }

  async getById(userId: string): Promise<UserProfile | undefined> {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId }
      })
    );
    return res.Item as UserProfile | undefined;
  }

  async update(userId: string, changes: Partial<UserProfile>): Promise<void> {
    const names: Record<string, string> = { "#pk": "userId" };
    const values: Record<string, any> = {};
    const sets: string[] = [];

    const assign = (field: keyof UserProfile, value: any) => {
      if (value === undefined) return;
      const nameKey = `#${String(field)}`;
      const valueKey = `:${String(field)}`;
      names[nameKey] = String(field);
      values[valueKey] = value;
      sets.push(`${nameKey} = ${valueKey}`);
    };

    assign("lat", changes.lat);
    assign("lon", changes.lon);
    assign("birthday", changes.birthday);
    assign("gender", changes.gender);
    assign("notificationsEnabled", changes.notificationsEnabled);
    assign("family", (changes as any).family);
    assign("nickname", (changes as any).nickname);

    if (sets.length === 0) {
      return; // nothing to update
    }

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: "attribute_exists(#pk)"
      })
    );
  }

  async removeFamily(userId: string): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: "REMOVE #family",
        ExpressionAttributeNames: { "#pk": "userId", "#family": "family" },
        ConditionExpression: "attribute_exists(#pk)"
      })
    );
  }
}
