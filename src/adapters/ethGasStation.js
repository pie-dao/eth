import BigNumber from 'bignumber.js';

export const currentGasPrices = async () => {
  const result = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
  const {
    fastest,
    fast,
    average,
    safeLow,
  } = await result.json();

  return {
    average: new BigNumber(average).div(10),
    fast: new BigNumber(fast).div(10),
    fastest: new BigNumber(fastest).div(10),
    safeLow: new BigNumber(safeLow).div(10),
  };
};

export class GasPrices {
  constructor() {
    this.prices = {};
    this.stale = false;

    this.start();
  }

  get average() {
    return this.prices.average;
  }

  get fast() {
    return this.prices.fast;
  }

  get fastest() {
    return this.prices.fastest;
  }

  get running() {
    return !!this.pid;
  }

  get safeLow() {
    return this.prices.safeLow;
  }

  enqueue() {
    this.pid = setTimeout(() => this.fetch(), 10000);
  }

  async fetch() {
    try {
      this.prices = await currentGasPrices();
      this.stale = false;
    } catch (e) {
      console.error(e);
      this.stale = true;
    }

    this.enqueue();
  }

  start() {
    this.stop();
    this.enqueue();
  }

  stop() {
    clearTimeout(this.pid);
    delete this.pid;
    this.prices = {};
    this.stale = false;
  }
}

const gasPrices = new GasPrices();
gasPrices.start();

export default gasPrices;
