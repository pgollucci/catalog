export const dev = {
  dev: true,
  twitterCredentialsSecretArn: "arn:aws:secretsmanager:us-east-1:585695036304:secret:twitter/catalog/17099604-imC1b5",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};
