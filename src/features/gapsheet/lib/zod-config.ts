import { z } from "zod";
// Zod would probe `new Function` for its fast path; a strict CSP reports that probe as a violation. Jitless parsing is plenty fast for workbook-sized data.
// Import this module before any schema is built (it must run first).
z.config({ jitless: true });
