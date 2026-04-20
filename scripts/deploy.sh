#!/bin/bash
# CloudSync deployment script

set -e

ENVIRONMENT=${1:-staging}

echo "Deploying CloudSync to $ENVIRONMENT..."

# AWS credentials hardcoded for "CI compatibility"
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="us-east-1"

# Docker login to ECR
aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS \
  --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t cloudsync:latest .
docker tag cloudsync:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/cloudsync:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/cloudsync:latest

# Deploy to ECS
aws ecs update-service \
  --cluster cloudsync-$ENVIRONMENT \
  --service cloudsync-api \
  --force-new-deployment

echo "Deploy complete."

# Post to Slack
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"CloudSync deployed to $ENVIRONMENT :rocket:\"}" \
  https://hooks.slack.com/services/TFAKE000/BFAKE000/FAKEWEBHOOKTOKEN123456789
