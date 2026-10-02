/**
 * Approved registry of structured tool results and the card that renders each. The chat looks cards up
 * here by result key instead of hand-writing one branch per tool; a result with no entry renders nothing.
 */
import type { ReactNode } from "react";
import type { Provenance } from "@/lib/intelligence/envelope";
import { RESULT_KEYS, type ResultKey } from "./resultKeys";
import { ChatDataDesk } from "./ChatDataDesk";
import { ChatCalcCard } from "./ChatCalcCard";
import { ChatSymbolCard } from "./ChatSymbolCard";
import { ChatScenarioCard } from "./ChatScenarioCard";
import { ChatMarketSimCard } from "./ChatMarketSimCard";
import { ChatWbCard } from "./ChatWbCard";
import { ChatFilingsCard } from "./ChatFilingsCard";
import { ChatMacroCard } from "./ChatMacroCard";
import { ChatEtfCard } from "./ChatEtfCard";
import { ChatDividendCard } from "./ChatDividendCard";
import { ChatFxCard } from "./ChatFxCard";
import { ChatProvenance } from "./ChatProvenance";
import { ChatMathCard } from "./ChatMathCard";
import { ChatLedgerCard } from "./ChatLedgerCard";
import { ChatOosCard } from "./ChatOosCard";
import { ChatCopyFundCard } from "./ChatCopyFundCard";

type Props<K> = { data: NonNullable<K> };

export interface ResultCardHost {
  desk?: React.ComponentProps<typeof ChatDataDesk>["data"];
  calc?: React.ComponentProps<typeof ChatCalcCard>["data"];
  symbol?: React.ComponentProps<typeof ChatSymbolCard>["info"];
  scenario?: React.ComponentProps<typeof ChatScenarioCard>["parts"];
  marketsim?: React.ComponentProps<typeof ChatMarketSimCard>["data"];
  wb?: React.ComponentProps<typeof ChatWbCard>["data"] | null;
  filings?: React.ComponentProps<typeof ChatFilingsCard>["data"] | null;
  etf?: React.ComponentProps<typeof ChatEtfCard>["data"] | null;
  macro?: React.ComponentProps<typeof ChatMacroCard>["data"] | null;
  dividends?: React.ComponentProps<typeof ChatDividendCard>["data"] | null;
  fx?: React.ComponentProps<typeof ChatFxCard>["data"] | null;
  prov?: Provenance;
  math?: React.ComponentProps<typeof ChatMathCard>["data"];
  ledger?: React.ComponentProps<typeof ChatLedgerCard>["data"] | null;
  oos?: React.ComponentProps<typeof ChatOosCard>["data"] | null;
  copyfund?: React.ComponentProps<typeof ChatCopyFundCard>["data"] | null;
}


type Renderer = (value: never, ctx: { onAsk: (q: string) => void }) => ReactNode;

/** Render order is the order of this table. */
const RESULT_CARDS: Record<ResultKey, Renderer> = {
  desk: ((data: Props<ResultCardHost["desk"]>["data"]) => <ChatDataDesk data={data} />) as unknown as Renderer,
  calc: ((data: Props<ResultCardHost["calc"]>["data"]) => <ChatCalcCard data={data} />) as unknown as Renderer,
  symbol: ((info: Props<ResultCardHost["symbol"]>["data"], ctx: { onAsk: (q: string) => void }) => <ChatSymbolCard info={info} onAsk={ctx.onAsk} />) as unknown as Renderer,
  scenario: ((parts: Props<ResultCardHost["scenario"]>["data"]) => <ChatScenarioCard parts={parts} />) as unknown as Renderer,
  marketsim: ((data: Props<ResultCardHost["marketsim"]>["data"]) => <ChatMarketSimCard data={data} />) as unknown as Renderer,
  wb: ((data: Props<ResultCardHost["wb"]>["data"]) => <ChatWbCard data={data} />) as unknown as Renderer,
  filings: ((data: Props<ResultCardHost["filings"]>["data"]) => <ChatFilingsCard data={data} />) as unknown as Renderer,
  macro: ((data: Props<ResultCardHost["macro"]>["data"]) => <ChatMacroCard data={data} />) as unknown as Renderer,
  etf: ((data: Props<ResultCardHost["etf"]>["data"]) => <ChatEtfCard data={data} />) as unknown as Renderer,
  dividends: ((data: Props<ResultCardHost["dividends"]>["data"]) => <ChatDividendCard data={data} />) as unknown as Renderer,
  fx: ((data: Props<ResultCardHost["fx"]>["data"]) => <ChatFxCard data={data} />) as unknown as Renderer,
  prov: ((prov: Props<ResultCardHost["prov"]>["data"]) => <ChatProvenance prov={prov} />) as unknown as Renderer,
  math: ((data: Props<ResultCardHost["math"]>["data"]) => <ChatMathCard data={data} />) as unknown as Renderer,
  ledger: ((data: Props<ResultCardHost["ledger"]>["data"]) => <ChatLedgerCard data={data} />) as unknown as Renderer,
  oos: ((data: Props<ResultCardHost["oos"]>["data"]) => <ChatOosCard data={data} />) as unknown as Renderer,
  copyfund: ((data: Props<ResultCardHost["copyfund"]>["data"]) => <ChatCopyFundCard data={data} />) as unknown as Renderer,
};


export function ToolResultCards({ message, onAsk }: { message: ResultCardHost; onAsk: (q: string) => void }) {
  return (
    <>
      {RESULT_KEYS.map((key) => {
        const value = message[key];
        return value ? <span key={key} className="contents">{(RESULT_CARDS[key] as (v: unknown, c: { onAsk: (q: string) => void }) => ReactNode)(value, { onAsk })}</span> : null;
      })}
    </>
  );
}
