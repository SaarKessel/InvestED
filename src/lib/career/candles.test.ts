import {describe,it,expect} from 'vitest';
import {fictionalCandles,validCandles} from './candles';
describe('truthful chart candles',()=>{
 it('never invents missing source OHLC',()=>{expect(validCandles([{date:'1',price:10} as never])).toEqual([]);expect(validCandles([{date:'1',open:10,high:10,low:10,close:10,price:10,ohlcAvailable:false}])).toEqual([]);});
 it('rejects inverted bars, invalid prices and duplicate dates',()=>{const bars=fictionalCandles([{day:1,price:10},{day:2,price:9}]);expect(validCandles([...bars,{...bars[0],high:1},{...bars[1],date:'3',close:NaN}])).toEqual(bars);});
 it('reveals only passed fictional days and bounds body within wick',()=>{const bars=fictionalCandles([{day:1,price:100},{day:2,price:92}]);expect(bars).toHaveLength(2);expect(bars[1]).toMatchObject({date:'2',open:100,close:92});expect(validCandles(bars)).toEqual(bars);});
});
