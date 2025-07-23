#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();
new BackendStack(app, `${process.env.CLIENT}-stack-${process.env.STAGE}`, {
  env: { account: process.env.TARGET_ACCOUNT as string, region: process.env.TARGET_REGION as string },
  stage: process.env.STAGE as string,
  client: process.env.CLIENT as string,
  existingUserPoolId: process.env.EXISTING_USER_POOL_ID as string,
  existingUserPoolClientId: process.env.EXISTING_USER_POOL_CLIENT_ID as string,
});