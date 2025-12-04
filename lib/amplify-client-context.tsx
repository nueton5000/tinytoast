"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

type AmplifyClient = ReturnType<typeof generateClient<Schema>>;

const AmplifyClientContext = createContext<AmplifyClient | null>(null);

export function AmplifyClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => generateClient<Schema>(), []);

  return (
    <AmplifyClientContext.Provider value={client}>
      {children}
    </AmplifyClientContext.Provider>
  );
}

export function useAmplifyClient() {
  const client = useContext(AmplifyClientContext);
  if (!client) {
    throw new Error("useAmplifyClient must be used within AmplifyClientProvider");
  }
  return client;
}
