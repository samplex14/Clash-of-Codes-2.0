"use client";

import React from "react";
import { ParticipantProvider } from "@/components/providers/ParticipantProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ParticipantProvider>{children}</ParticipantProvider>
    </ErrorBoundary>
  );
};

export default AppProviders;
