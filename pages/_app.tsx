import "@/styles/app.css";
import type { AppProps } from "next/app";
import { AmplifyConfig } from "@/components/providers/amplify-config";
import { AmplifyClientProvider } from "@/lib/amplify-client-context";
import { AuthWrapper } from "@/components/layout/auth-wrapper";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AmplifyConfig>
      <AmplifyClientProvider>
        <AuthWrapper>
          <Component {...pageProps} />
        </AuthWrapper>
      </AmplifyClientProvider>
    </AmplifyConfig>
  );
}
