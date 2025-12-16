// src/utils/amplify-config.ts
import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    console.error("❌ Missing Amplify Configuration!");
    console.error("Please check your .env.local or Vercel Environment Variables.");
    console.error("NEXT_PUBLIC_COGNITO_USER_POOL_ID:", userPoolId);
    console.error("NEXT_PUBLIC_COGNITO_CLIENT_ID:", userPoolClientId);
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      }
    }
  });
}