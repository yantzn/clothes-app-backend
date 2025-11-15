#!/bin/sh
echo "Waiting for DynamoDB..."
sleep 5

echo "Creating UserProfile table..."
aws dynamodb create-table \
  --table-name UserProfile \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://dynamodb:8000 \
  --region ap-northeast-1

echo "UserProfile table created."
