import "@harkat/engine";

declare module "@harkat/engine" {
  export type ChatProvider = {
    id: string;
    key: string;
    base: string;
    model: string;
    headers?: Record<string, string>;
  };
  export function configuredProviders(env?: NodeJS.ProcessEnv): ChatProvider[];
}
