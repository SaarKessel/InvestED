import { createContext, useContext } from "react";

/** True when a page renders inside the chat thread: the page drops its own header and footer. */
export const EmbedContext = createContext(false);
export function useEmbedded(): boolean {
  return useContext(EmbedContext);
}
