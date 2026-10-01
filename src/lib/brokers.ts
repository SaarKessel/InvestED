export interface BrokerInfo {
  name: { he: string; en: string };
  url: string;
}

/** Official-link directory only. No fees or terms are stored: they change and cannot be verified from a free source. */
export const BROKERS: BrokerInfo[] = [
  { name: { he: "Interactive Brokers (ישראל)", en: "Interactive Brokers" }, url: "https://www.interactivebrokers.com" },
  { name: { he: "eToro", en: "eToro" }, url: "https://www.etoro.com" },
  { name: { he: "מיטב טרייד", en: "Meitav Trade" }, url: "https://www.meitavtrade.co.il" },
  { name: { he: "פסגות טרייד", en: "Psagot Trade" }, url: "https://www.psagot.co.il/trade_heb/" },
  { name: { he: "בלינק טרייד", en: "Blink Trade" }, url: "https://heyblink.com/pricing/" },
  { name: { he: "IBI טרייד", en: "IBI Trade" }, url: "https://www.ibi.co.il" },
];
