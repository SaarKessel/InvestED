export interface BrokerInfo {
  name: string;
  app: string;
  tradingFee: string;
  managementFee: string;
  minDeposit: string;
  url: string;
  highlight?: string;
  // --- ׳©׳“׳•׳× ׳׳¡׳₪׳¨׳™׳™׳ ׳׳™׳ ׳“׳™׳§׳˜׳™׳‘׳™׳™׳, ׳׳¦׳•׳¨׳ ׳׳—׳©׳‘׳•׳ ׳”׳¢׳׳׳•׳× ׳”׳“׳™׳ ׳׳™ ׳‘׳׳‘׳“ ---
  monthlyFeeILS: number;
  perTradeFeeILS: number;
  fxSpreadPct: number;
}

export const BROKERS: BrokerInfo[] = [
  {
    name: "Interactive Brokers (׳™׳©׳¨׳׳)",
    app: "IBKR Mobile",
    tradingFee: "׳›-1 ׳¡׳ ׳˜ ׳׳׳ ׳™׳” (׳׳™׳ ׳™׳׳•׳ ׳›-1$-2$ ׳׳¢׳¡׳§׳”)",
    managementFee: "׳׳׳ ׳“׳׳™ ׳ ׳™׳”׳•׳ ׳§׳‘׳•׳¢׳™׳",
    minDeposit: "׳׳׳ ׳׳™׳ ׳™׳׳•׳ ׳¨׳©׳׳™",
    url: "https://www.interactivebrokers.com",
    highlight: "׳¢׳׳׳•׳× ׳׳”׳ ׳׳•׳›׳•׳× ׳‘׳©׳•׳§, ׳₪׳׳˜׳₪׳•׳¨׳׳” ׳׳§׳¦׳•׳¢׳™׳×",
    monthlyFeeILS: 0,
    perTradeFeeILS: 7,
    fxSpreadPct: 0.2,
  },
  {
    name: "eToro",
    app: "eToro",
    tradingFee: "0% ׳¢׳׳׳× ׳׳¡׳—׳¨ ׳¢׳ ׳׳ ׳™׳•׳× (׳׳¨׳•׳•׳— ׳©׳¢׳¨ ׳‘׳”׳׳¨׳× ׳׳˜\"׳—)",
    managementFee: "׳׳׳ ׳“׳׳™ ׳ ׳™׳”׳•׳, ׳™׳© ׳¢׳׳׳× ׳׳™-׳₪׳¢׳™׳׳•׳×",
    minDeposit: "׳›-50$-100$ ׳‘׳”׳×׳׳ ׳׳׳“׳™׳ ׳”",
    url: "https://www.etoro.com",
    highlight: "׳₪׳©׳•׳˜ ׳׳׳×׳—׳™׳׳™׳, ׳›׳•׳׳ ׳׳¡׳—׳¨ ׳—׳׳§׳™ ׳‘׳׳ ׳™׳•׳×",
    monthlyFeeILS: 0,
    perTradeFeeILS: 0,
    fxSpreadPct: 1.0,
  },
  {
    name: "׳׳™׳˜׳‘ ׳˜׳¨׳™׳™׳“",
    app: "Meitav Trade",
    tradingFee: "׳›-1 ׳¡׳ ׳˜ ׳׳׳ ׳™׳”, ׳׳™׳ ׳™׳׳•׳ ׳›-5$-7.5$ ׳׳¢׳¡׳§׳”",
    managementFee: "׳›-15 ג‚× ׳“׳׳™ ׳˜׳™׳₪׳•׳ ׳—׳•׳“׳©׳™׳™׳ (׳‘׳›׳₪׳•׳£ ׳׳”׳˜׳‘׳•׳×)",
    minDeposit: "׳›-5,000 ג‚×",
    url: "https://www.meitavtrade.co.il",
    highlight: "׳‘׳™׳× ׳”׳©׳§׳¢׳•׳× ׳™׳©׳¨׳׳׳™ ׳•׳×׳™׳§ ׳•׳׳•׳›׳¨",
    monthlyFeeILS: 15,
    perTradeFeeILS: 27,
    fxSpreadPct: 0.5,
  },
  {
    name: "׳₪׳¡׳’׳•׳× ׳˜׳¨׳™׳™׳“",
    app: "Psagot Trade",
    tradingFee: "׳׳”׳¢׳׳׳•׳× ׳”׳ ׳׳•׳›׳•׳× ׳׳׳¡׳—׳¨ ׳‘׳×\"׳; ׳¢׳׳׳” ׳¢׳ ׳׳¡׳—׳¨ ׳‘׳—׳•\"׳",
    managementFee: "׳₪׳˜׳•׳¨ ׳׳“׳׳™ ׳ ׳™׳”׳•׳ ׳•׳׳“׳׳™ ׳׳©׳׳¨׳×",
    minDeposit: "׳›-5,000-10,000 ג‚× (׳‘׳”׳×׳׳ ׳׳׳¡׳׳•׳)",
    url: "https://www.psagot-trade.co.il",
    highlight: "׳₪׳•׳₪׳•׳׳¨׳™ ׳׳׳¡׳—׳¨ ׳¢׳¦׳׳׳™ ׳‘׳‘׳•׳¨׳¡׳× ׳×\"׳",
    monthlyFeeILS: 0,
    perTradeFeeILS: 20,
    fxSpreadPct: 0.5,
  },
  {
    name: "׳‘׳׳™׳ ׳§ ׳˜׳¨׳™׳™׳“",
    app: "Blink",
    tradingFee: "׳¢׳׳׳” ׳×׳—׳¨׳•׳×׳™׳× ׳׳׳¡׳—׳¨ ׳‘׳׳¨׳¥ ׳•׳‘׳—׳•\"׳",
    managementFee: "׳׳‘׳¦׳¢׳™׳ ׳×׳§׳•׳₪׳×׳™׳™׳ ׳׳₪׳˜׳•׳¨ ׳׳“׳׳™ ׳ ׳™׳”׳•׳",
    minDeposit: "׳׳׳ ׳׳™׳ ׳™׳׳•׳ ׳§׳‘׳•׳¢",
    url: "https://www.blink.co.il",
    highlight: "׳₪׳׳˜׳₪׳•׳¨׳׳× ׳׳¡׳—׳¨ ׳¢׳¦׳׳׳™׳× ׳¢׳ ׳׳׳©׳§ ׳™׳“׳™׳“׳•׳×׳™ ׳׳׳×׳—׳™׳׳™׳",
    monthlyFeeILS: 0,
    perTradeFeeILS: 25,
    fxSpreadPct: 0.6,
  },
  {
    name: "IBI ׳˜׳¨׳™׳™׳“",
    app: "IBI Trade",
    tradingFee: "׳¢׳׳׳•׳× ׳“׳•׳¨׳’׳•׳× ׳׳₪׳™ ׳¡׳•׳’ ׳”׳ ׳›׳¡ ׳•׳”׳©׳•׳§",
    managementFee: "׳‘׳›׳₪׳•׳£ ׳׳׳¡׳׳•׳ ׳©׳ ׳‘׳—׳¨",
    minDeposit: "׳›-5,000 ג‚×",
    url: "https://www.ibi.co.il",
    highlight: "׳‘׳™׳× ׳”׳©׳§׳¢׳•׳× ׳™׳©׳¨׳׳׳™ ׳׳•׳‘׳™׳ ׳¢׳ ׳׳’׳•׳•׳ ׳׳₪׳™׳§׳™׳",
    monthlyFeeILS: 15,
    perTradeFeeILS: 25,
    fxSpreadPct: 0.5,
  },
];

