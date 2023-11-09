#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MsTokenizacionThalesStack } from '../lib/ms-tokenizacion-thales-stack';
import { BuildConfig } from '../config/BuildConfig';

const app = new cdk.App();
const nameStackApplication = `ms-tokenizacion-thales`;

const Main = async (app: any) => {

  const stage = app.node.tryGetContext("stage") || "dev";
  const region = app.node.tryGetContext("region") || "us-east-1";

  // call to configuration and systemManager
  const buildCondig = new BuildConfig(nameStackApplication, stage);
  const config: any = await buildCondig.getConfig();

  try {
    new MsTokenizacionThalesStack(app, `${nameStackApplication}-${stage}`, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region
      },
      tags: config
    });
  } catch (e) {
    console.error(e);
  }

  app.synth();
}

Main(app);