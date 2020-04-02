/* eslint no-use-before-define: 0 */
import BigNumber from 'bignumber.js';
import provider from 'eth-provider';
import PubSub from 'pubsub-js';

import { erc20 } from '@pie-dao/abis';
import { ethers } from 'ethers';
import { store } from '@risingstack/react-easy-state';
import { validateIsBigNumber } from '@pie-dao/utils';

import blocknative from './adapters/blocknative';
import gasPrices from './adapters/ethGasStation';
import simpleId from './adapters/simpleId';

import { defaultNetwork } from './config';

const internal = {
  provider: undefined,
  network: {},
};

const logPrefix = (functionName) => `@pie-dao/eth - eth#${functionName}`;

export const eth = store({
  account: undefined,
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
  findProvider: () => {
    const existingProvider = provider(['frame', 'injected']);

    if (existingProvider) {
      console.log('existingProvider', existingProvider);
      eth.getLibrary(existingProvider);
    }
  },
  getLibrary: (ethProvider) => {
    const { networkVersion } = ethProvider;

    eth.reset();
    eth.dismissError();

    if (eth.disconnected) {
      return;
    }

    if (!networkVersion) {
      eth.setError({ message: 'Ethereum not found. Unable to connect. Is MetaMask installed?' });
      return;
    }

    if (parseInt(networkVersion, 10) !== eth.networkId) {
      eth.wrongNetworkError();
      return;
    }

    ethProvider.on('accountsChanged', () => {
      eth.getLibrary(ethProvider);
    });

    eth.initializeAccount(ethProvider);
  },
  init: async ({ blocknativeDappId, network = defaultNetwork, simpleIdAppId }) => {
    internal.provider = ethers.getDefaultProvider(network);
    internal.network = await internal.provider.getNetwork();
    internal.networkName = network;

    eth.disconnected = localStorage.getItem('disconnected') === 'true';
    console.log(internal.network);
    eth.networkId = internal.network.chainId;

    blocknative.initialize(blocknativeDappId, eth.networkId);
    simpleId.initialize(simpleIdAppId, network);

    window.addEventListener('DOMContentLoaded', eth.findProvider);
  },
  initializeAccount: async (ethProvider) => {
    const { selectedAddress } = ethProvider;
    eth.account = selectedAddress;
    PubSub.publish('accountChanged', { account: selectedAddress });
    eth.provider = new ethers.providers.Web3Provider(ethProvider);
    eth.signer = eth.provider.getSigner();
    modal.close();

    simpleId.user({ address: eth.account });
  },
  notify: ({ hash }) => blocknative.notify(hash),
  on: (event, subscriber) => PubSub.subscribe(event, subscriber),
  reconnect: () => {
    eth.disconnected = false;
    localStorage.setItem('disconnected', false);
    eth.findProvider();
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
