import provider from 'eth-provider';

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
  networkName: undefined,
  provider: undefined,
  wrongNetwork: false,

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
  },
  initializeAccount: async (ethProvider) => {
    eth.account = ethProvider.selectedAddress;
    eth.provider = new ethers.providers.Web3Provider(ethProvider);
    eth.signer = eth.provider.getSigner();
    modal.close();

    simpleId.user({ address: eth.account });
  },
  notify: ({ hash }) => blocknative.notify(hash),
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
