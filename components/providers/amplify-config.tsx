"use client";

import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";
import outputs from "@/amplify_outputs.json";

// Configure Amplify immediately when this module loads
if (typeof window !== 'undefined') {
  Amplify.configure(outputs, { ssr: true });

  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      domain: window.location.hostname,
      path: '/',
      expires: 365,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
  );
}

export function AmplifyConfig({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
