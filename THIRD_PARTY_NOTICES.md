# Third-party notices

## TradingView Lightweight Charts
- Project: https://github.com/tradingview/lightweight-charts
- License: Apache License 2.0 (verified from the repository and the installed package, version 5.2.1)
- Use: price charts in the chat side panel. The TradingView attribution logo on the chart is kept as the license and the project ask.

## Frankfurter (European Central Bank reference rates)
- Service: https://frankfurter.dev, data from the European Central Bank daily reference rates
- Use: currency conversion in chat. Shown as a daily reference rate, not a live trading quote.

## FinanceDatabase
- Project: https://github.com/JerBouma/FinanceDatabase
- License: MIT (verified from the repository's license field)
- Use: src/data/symbols.json, a trimmed copy (US large and mega cap stocks and US-listed ETFs; name, sector or issuer only; no descriptions, no prices). Rebuild with scripts/build-symbol-db.py. Shown as identity details only.

## World Bank Open Data
- Service: https://data.worldbank.org , API at api.worldbank.org
- License: Creative Commons Attribution 4.0 (CC BY 4.0), attribution shown on every card
- Use: yearly country statistics in chat (inflation, GDP growth, unemployment).

## Vibe-Trading (ideas only, no code copied)
- Project: https://github.com/HKUDS/Vibe-Trading
- License: MIT
- Use: concepts of ordered data-source fallback by failure risk with symbol-to-market routing (src/lib/market/marketRouting.ts) and the choice of backtest metrics (src/lib/backtest/performance.ts). Reimplemented in TypeScript.

## FinRL (concepts only, no code copied)
- Project: https://github.com/AI4Finance-Foundation/FinRL
- License: MIT
- Use: the discipline of a chronological train/test split in the Strategy Lab historical performance panel. InvestED does the opposite of FinRL's default data handling: missing values are never back-filled or zero-filled, they are dropped, counted and labeled unavailable.

## Microsoft Qlib (formula ideas only, no code copied)
- Project: https://github.com/microsoft/qlib
- License: Apache License 2.0 (see the project's NOTICE)
- Use: the candlestick-body and range-position factor definitions in src/lib/market/factors.ts were re-written from their standard definitions.

## SEC EDGAR (Form 13F)
- Service: https://www.sec.gov/edgar , data.sec.gov submissions API and EDGAR archives
- Terms: public US government data, free, no key. Requests carry a descriptive User-Agent with a contact address as the SEC requires (override with SEC_USER_AGENT).
- Use: read-only latest 13F-HR holdings of an institutional manager (api/sec-13f.ts). Values are shown exactly as reported, with the filing date and a link to the filing. 13F is delayed, long-only and not a live portfolio.

## FinGPT (idea only, no code or weights copied)
- Project: https://github.com/AI4Finance-Foundation/FinGPT
- License: MIT
- Use: the idea of rating news headlines positive / negative / neutral. InvestED uses its single Gemini layer on the headline text only, validates every rating, and labels it "AI estimate" in the UI (src/lib/news/sentiment.ts).
- Also used for: the positives / concerns / outlook layout of the research scenario brief (src/lib/research/scenarioBrief.ts). It is educational scenario analysis and never a price prediction.

## FinceptTerminal (concepts only, no code read or copied)
- Project: https://github.com/Fincept-Corporation/FinceptTerminal (its license does not allow reuse of the code, so none was used)
- Use: only the idea of offering DCF, VaR, Sharpe and portfolio-optimization tools. They were written from standard textbook formulas: Gordon-growth DCF, empirical and normal VaR with expected shortfall (Acklam inverse-normal approximation), and long-only minimum-variance weights via projected gradient (simplex projection after Duchi et al., 2008). See src/lib/analytics/.

## ECB Data Portal and IMF DataMapper (official data, no key)
- ECB: https://data.ecb.europa.eu , main refinancing operations rate, queried directly from the browser (the API allows CORS).
- IMF: https://www.imf.org/external/datamapper/api/ , World Economic Outlook figures through a fixed-allowlist pass-through (/api/imf-weo). Estimates and projections are labeled in the UI. Source attribution is shown on the card.
- The World Bank desk already existed (CC BY 4.0). FRED was intentionally not used because it needs a key.
