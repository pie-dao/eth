/* eslint no-use-before-define: 0 */
import BigNumber from 'bignumber.js';
import isMobile from 'ismobilejs';
import PubSub from 'pubsub-js';

import { erc20 } from '@pie-dao/abis';
import { ethers } from 'ethers';
import { store } from '@risingstack/react-easy-state';
import { validateIsBigNumber } from '@pie-dao/utils';

import blocknative from './adapters/blocknative';
import gasPrices from './adapters/ethGasStation';
import simpleId from './adapters/simpleId';

import { defaultNetwork } from './config';
import { enable, metamaskProvider, metamaskMobileProvider } from './adapters/ethereumProviders';

const internal = {
  provider: undefined,
  network: {},
};

const logPrefix = (functionName) => `@pie-dao/eth - eth#${functionName}`;

export const eth = store({
  account: undefined,
  chainId: undefined,
  disconnected: false,
  error: undefined,
  networkId: undefined,
  networkName: undefined,
  provider: undefined,
  signer: undefined,
  wrongNetwork: false,

  approve: async ({ spender, token, amount = ethers.constants.MaxUint256 }) => {
    const {
      account,
      notify,
      setError,
      signer,
      transactionOverrides,
    } = eth;

    if (!account) {
      setError('Your wallet must be connected before you can approve an asset for transfer.');
    }

    const prefix = logPrefix('approve');
    const value = BigNumber(amount.toString());

    validateIsBigNumber(value, { prefix });

    const contract = new ethers.Contract(token, erc20, signer);
    const allowance = await contract.allowance(account, spender);

    if (allowance.isZero()) {
      const amt = ethers.utils.bigNumberify(value.toFixed());
      const overrides = transactionOverrides({ gasLimit: 100000 });
      notify(await contract.approve(spender, amt, overrides));
    }
  },
  disconnect: () => {
    eth.disconnected = true;
    eth.reset();
    localStorage.setItem('disconnected', true);
  },
  dismissError: () => {
    eth.error = undefined;
    blocknative.dismissError();
  },
  enable: () => {
    console.log('internal', internal);
    enable(internal.provider);
  },
  findProvider: async () => {
    const prefix = logPrefix('findProvider');

    if (!internal.provider) {
      internal.provider = undefined;

      try {
        if (isMobile.any) {
          console.log('mobile');
          internal.provider = await metamaskMobileProvider(); // TODO: add others
        } else {
          console.log('not mobile');
          internal.provider = await metamaskProvider(); // TODO: add others
        }
      } catch (e) {
        console.error(prefix, e);
      }
    }

    console.log('internal post findProvider', internal);

    eth.reset();
    eth.dismissError();

    if (eth.disconnected) {
      return;
    }

    if (!internal.provider) {
      eth.setError({ message: 'Ethereum not found. Unable to connect.' });
      return;
    }

    eth.initializeAccount();
  },
  init: async ({ blocknativeDappId, network = defaultNetwork, simpleIdAppId }) => {
    const provider = ethers.getDefaultProvider(network);
    internal.network = await provider.getNetwork();
    internal.networkName = network;

    eth.disconnected = localStorage.getItem('disconnected') === 'true';
    eth.chainId = internal.network.chainId;
    eth.networkId = `${internal.network.chainId}`;

    blocknative.initialize(blocknativeDappId, eth.chainId);
    simpleId.initialize(simpleIdAppId, network);

    PubSub.subscribe('providerAccountChanged', (message, newProvider) => {
      console.log('providerAccountChanged', newProvider);
      internal.provider = newProvider;
      eth.findProvider();
    });

    PubSub.subscribe('providerChainChanged', (message, newProvider) => {
      console.log('providerChainChanged', newProvider);
      internal.provider = newProvider;
      eth.findProvider();
    });

    window.addEventListener('DOMContentLoaded', () => { eth.findProvider(); });
  },
  initializeAccount: async () => {
    const {
      account,
      chainId,
      provider,
      signer,
    } = internal.provider;

    if (eth.chainId !== chainId) {
      eth.wrongNetworkError();
      return;
    }

    if (!account) {
      return;
    }

    eth.account = account;
    eth.provider = provider;
    eth.signer = signer;

    PubSub.publish('accountChanged', { account });

    modal.close();

    simpleId.user({ address: account });
  },
  notify: ({ hash }) => blocknative.notify(hash),
  on: (event, subscriber) => PubSub.subscribe(event, subscriber),
  reconnect: () => {
    eth.disconnected = false;
    localStorage.setItem('disconnected', false);
    eth.findProvider(0);
  },
  reset: () => {
    eth.account = undefined;
    eth.accountProvider = undefined;
  },
  setError: ({ message, eventCode = 'error', type = 'error' }) => {
    eth.dismissError();
    eth.error = message;
    blocknative.displayError({ message, eventCode, type });
  },
  transactionOverrides: ({ gasLimit = 21000 }) => ({
    gasLimit,
    gasPrice: ethers.utils.parseUnits(gasPrices.fast.toFixed(), 'gwei'),
  }),
  wrongNetworkError: () => {
    eth.reset();
    eth.wrongNetwork = true;
    eth.setError({
      eventCode: 'wrongNetwork',
      message: `Incorrect network. Please connect to ${internal.networkName}.`,
    });
  },
});

export const modal = store({
  isActive: false,
  isPending: false,

  close: () => {
    modal.isActive = false;
    modal.reset();
  },
  disconnect: () => {
    modal.close();
    eth.disconnect();
    localStorage.setItem('disconnected', true);
  },
  onError({ message }) {
    modal.isPending = false;

    if (message) {
      console.error('@pie-dao/eth: modal activate error', message);

      // TODO: handle incorrect network
    }

    eth.setError({ message });
  },
  open: () => {
    modal.isActive = true;
  },
  reconnect: () => eth.reconnect(),
  reset: () => {
    eth.dismissError();
    modal.isPending = false;
  },
});
