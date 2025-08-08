// Example strategy logic implementations for pattern-based trading

export function rsiEmaCrossStrategy(data: any): 'buy' | 'sell' | null {
  const { rsi, emaShort, emaLong, price } = data;

  if (rsi < 30 && emaShort > emaLong && price > emaShort) {
    return 'buy';
  } else if (rsi > 70 && emaShort < emaLong && price < emaShort) {
    return 'sell';
  }
  return null;
}

export function breakoutVolumeSpike(data: any): 'buy' | 'sell' | null {
  const { price, previousHigh, volume, avgVolume } = data;

  if (price > previousHigh && volume > avgVolume * 1.5) {
    return 'buy';
  } else if (price < previousHigh * 0.95 && volume > avgVolume * 1.5) {
    return 'sell';
  }
  return null;
}

export function macdSignalFlip(data: any): 'buy' | 'sell' | null {
  const { macd, macdSignal } = data;

  if (macd > macdSignal) return 'buy';
  if (macd < macdSignal) return 'sell';
  return null;
}

export function bollingerBandBounce(data: any): 'buy' | 'sell' | null {
  const { price, lowerBand, upperBand } = data;

  if (price < lowerBand) return 'buy';
  if (price > upperBand) return 'sell';
  return null;
}