import type {MarketAsset} from '@/types';

/** Source-based paper-order ledger: device-local teaching record, fully separate from every fictional game ledger.
 *  Each order freezes an immutable source/time/price snapshot; no order ever executes, settles or moves real or fictional cash. */
export interface PaperOrderSnapshot {
  symbol: string;
  price: number;
  currency: string;
  sourceTimestamp: string;
  capturedAt: string;
  freshness: 'current' | 'recent' | 'stale';
}
export interface PaperOrder {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  snapshot: PaperOrderSnapshot;
  recordedAt: string;
}
export const PAPER_LEDGER_KEY = 'invested_paper_ledger_v1';
export const PAPER_LEDGER_LIMIT = 50;
export class PaperLedgerConflictError extends Error {}

const isTimestamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function isPaperOrderSnapshot(value: unknown): value is PaperOrderSnapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as PaperOrderSnapshot;
  return typeof s.symbol === 'string' && /^[A-Z0-9^][A-Z0-9.\-^=]{0,9}$/.test(s.symbol) &&
    Number.isFinite(s.price) && s.price > 0 &&
    typeof s.currency === 'string' && /^[A-Z]{3}$/.test(s.currency) &&
    isTimestamp(s.sourceTimestamp) && isTimestamp(s.capturedAt) &&
    Date.parse(s.sourceTimestamp) <= Date.parse(s.capturedAt) + 5 * 60 * 1000 &&
    ['current', 'recent', 'stale'].includes(s.freshness);
}
export function isPaperOrder(value: unknown): value is PaperOrder {
  if (!value || typeof value !== 'object') return false;
  const o = value as PaperOrder;
  return typeof o.id === 'string' && o.id.length > 0 &&
    (o.side === 'buy' || o.side === 'sell') &&
    Number.isFinite(o.quantity) && o.quantity > 0 &&
    isPaperOrderSnapshot(o.snapshot) && isTimestamp(o.recordedAt);
}
/** Freeze an inspected source asset into an order snapshot. Returns null for mocked, non-Yahoo or malformed assets. */
export function buildSnapshot(asset: MarketAsset, capturedAt = new Date()): PaperOrderSnapshot | null {
  if (!asset || asset.isMock !== false || asset.dataSource !== 'yahoo_finance') return null;
  const snapshot: PaperOrderSnapshot = {
    symbol: asset.symbol, price: asset.price, currency: asset.currency ?? '',
    sourceTimestamp: asset.timestamp ?? '', capturedAt: capturedAt.toISOString(),
    freshness: asset.freshness === 'current' || asset.freshness === 'recent' || asset.freshness === 'stale' ? asset.freshness : 'stale',
  };
  return isPaperOrderSnapshot(snapshot) ? snapshot : null;
}
export function newOrder(side: PaperOrder['side'], quantity: number, snapshot: PaperOrderSnapshot, now = new Date()): PaperOrder {
  return {id: crypto.randomUUID(), side, quantity, snapshot, recordedAt: now.toISOString()};
}
export function readLedger(): PaperOrder[] {
  try {
    const raw = localStorage.getItem(PAPER_LEDGER_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > PAPER_LEDGER_LIMIT || !value.every(isPaperOrder)) return [];
    return value;
  } catch { return []; }
}
/** Guarded append: the caller must pass the list it last read, so a stale tab can never silently drop another tab's orders. */
export function recordOrder(order: PaperOrder, expected: PaperOrder[]): PaperOrder[] {
  const current = readLedger();
  if (JSON.stringify(current) !== JSON.stringify(expected)) throw new PaperLedgerConflictError('A newer paper ledger exists');
  const next = [...current, order].slice(-PAPER_LEDGER_LIMIT);
  localStorage.setItem(PAPER_LEDGER_KEY, JSON.stringify(next));
  return next;
}
export interface PaperPosition {symbol: string; currency: string; netQuantity: number;}
/** Net quantity per symbol+currency. Currencies are never converted or mixed. */
export function positions(orders: PaperOrder[]): PaperPosition[] {
  const map = new Map<string, PaperPosition>();
  for (const order of orders) {
    const key = `${order.snapshot.currency}:${order.snapshot.symbol}`;
    const position = map.get(key) ?? {symbol: order.snapshot.symbol, currency: order.snapshot.currency, netQuantity: 0};
    position.netQuantity += order.side === 'buy' ? order.quantity : -order.quantity;
    map.set(key, position);
  }
  return [...map.values()].filter(position => position.netQuantity !== 0);
}
/** Per-currency notional totals of order snapshots. Teaching record only - no cash accounting. */
export function notionalByCurrency(orders: PaperOrder[]): {currency: string; bought: number; sold: number}[] {
  const map = new Map<string, {currency: string; bought: number; sold: number}>();
  for (const order of orders) {
    const row = map.get(order.snapshot.currency) ?? {currency: order.snapshot.currency, bought: 0, sold: 0};
    row[order.side === 'buy' ? 'bought' : 'sold'] += order.quantity * order.snapshot.price;
    map.set(order.snapshot.currency, row);
  }
  return [...map.values()];
}
