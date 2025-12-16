'use client'; // <--- WAJIB ADA DI BARIS PERTAMA!

import { Amplify } from 'aws-amplify';
import { useEffect } from 'react';

// Kita pindahkan config ke luar component biar jalan secepat mungkin
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    }
  }
});

export default function ConfigureAmplifyClientSide() {
  useEffect(() => {
    // INI LOG DEBUGGING (Cek di Console Browser nanti)
    console.log("-----------------------------------------");
    console.log("✅ ConfigureAmplify Component Mounted!");
    console.log("User Pool ID:", process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
    console.log("Client ID:", process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
    console.log("-----------------------------------------");
  }, []);

  return null;
}