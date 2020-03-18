import { ethers } from 'ethers';
import { store } from 'react-easy-state';

import blocknative from './adapters/blocknative';
import simpleId from './adapters/simpleId';

import { defaultNetwork } from './config';

const internal = {
  provider: undefined,
  network: {},
};

export const eth = store({
  account: undefined,
  disconnected: false,
  error: undefined,
  networkId: undefined,
  provider: undefined,

  disconnect: () => {
    eth.disconnected = true;
    eth.reset();
    localStorage.setItem('disconnected', true);
  },
  dismissError: () => {
    eth.error = undefined;
    blocknative.dismissError();
  },
  getLibrary: (provider) => {
    eth.reset();
    eth.dismissError();

    if (eth.disconnected) {
      return undefined;
    }

    if (!provider.networkVersion) {
      eth.error = 'Ethereum not found. Unable to connect. Is MetaMask installed?';
      return undefined;
    }

    if (parseInt(provider.networkVersion, 10) !== internal.networkId) {
      eth.wrongNetwork();
      return undefined;
    }

    eth.initializeAccount(provider);

    return eth.provider;
  },
  init: async ({ blocknativeDappId, network = defaultNetwork, simpleIdAppId }) => {
    internal.provider = ethers.getDefaultProvider(network);
    internal.network = await internal.provider.getNetwork();

    eth.disconnected = localStorage.getItem('disconnected') === 'true';
    eth.networkId = internal.network.chainId;

    blocknative.initialize(blocknativeDappId, eth.networkId);
    simpleId.initialize(simpleIdAppId, network);
  },
  initializeAccount: async (provider) => {
    eth.account = provider.selectedAddress;
    eth.provider = new ethers.providers.Web3Provider(provider);
    eth.signer = eth.provider.getSigner();

    simpleId.user({ address: eth.account });
  },
  notify: ({ hash }) => blocknative.notify(hash),
  reconnect: () => {
    eth.disconnected = false;
    localStorage.setItem('disconnected', false);
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
  wrongNetwork: () => {
    eth.reset();
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
  onError(e) {
    if (e) {
      console.error('@pie-dao/eth: modal activate error', e);
    }

    modal.isPending = false;
    eth.wrongNetwork();
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
