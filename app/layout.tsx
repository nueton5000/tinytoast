import "@/styles/app.css";
import type { Metadata } from "next";
import { AmplifyConfig } from "@/components/providers/amplify-config";
import { AmplifyClientProvider } from "@/lib/amplify-client-context";
import { AuthWrapper } from "@/components/layout/auth-wrapper";

export const metadata: Metadata = {
  title: {
    template: "%s | tiny toast",
    default: "Resume | tiny toast",
  },
  description: "Professional resume with feedback and improvement tracking",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "tiny toast",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AmplifyConfig>
          <AmplifyClientProvider>
            <AuthWrapper>{children}</AuthWrapper>
          </AmplifyClientProvider>
        </AmplifyConfig>
      </body>
    </html>
  );
}
