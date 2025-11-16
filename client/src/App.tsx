import { useState, useMemo } from "react";
import { Switch, Route } from "wouter";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { createQueryClient } from "./lib/queryClient";
import { setupMutationDefaults } from "./lib/mutation-defaults";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import History from "@/pages/history";
import Upload from "@/pages/upload";
import Statements from "@/pages/statements";
import Settings from "@/pages/settings";
import BulkAdd from "@/pages/bulk-add";
import NotFound from "@/pages/not-found";
import NetworkStatus from "@/components/network-status";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/history" component={History} />
      <Route path="/upload" component={Upload} />
      <Route path="/statements" component={Statements} />
      <Route path="/bulk-add" component={BulkAdd} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    setupMutationDefaults(client);
    return client;
  });

  const persister = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: 'COUPLE_FINANCE_CACHE',
    });
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister,
        maxAge: 1000 * 60 * 60 * 24,
      }}
      onSuccess={() => {
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      <TooltipProvider>
        <Toaster />
        <NetworkStatus />
        <Router />
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
