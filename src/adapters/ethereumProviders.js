/* eslint no-param-reassign: 0 */
/* eslint quote-props: 0 */

import PubSub from 'pubsub-js';

import { ethers } from 'ethers';

const logPrefix = (functionName) => `@pie-dao/eth - adapters/ethereumProviders - ${functionName}`;

const metamaskError = new Error('MetaMask provider cannot be loaded');

const networkMap = {
  '1': 'mainnet',
  '3': 'ropsten',
  '4': 'rinkeby',
  '5': 'goerli',
  '42': 'kovan',
};

const getAccount = async (signer) => {
  const prefix = logPrefix('getAccount');
  let account;

  if (signer) {
    try {
      account = await signer.getAddress();
      if (account) {
        account = account.toLowerCase();
      }
    } catch (e) {
      console.error(prefix, e);
    }
  }

  return account;
};

const loadNetworkMetamask = async (raw) => {
  const prefix = logPrefix('loadNetworkMetamask');

  const provider = new ethers.providers.Web3Provider(raw);
  const signer = await provider.getSigner();
  const rpc = raw.request || raw.send;
  const { result } = await rpc('net_version');
  const { chainId } = await provider.getNetwork();
  const networkName = networkMap[result];

  if (chainId.toString() !== result) {
    throw new Error(`${prefix}: chainId and networkId mismatch (#{chainId} !== ${result})`);
  }

  const account = await getAccount(signer);

  return {
    account,
    chainId,
    networkName,
    provider,
    signer,

    networkVersion: result,
  };
};

export const enable = async (provider) => {
  const prefix = logPrefix('normalizeMetamask');
  console.log(prefix, 'got here', provider);

  const { account, raw } = provider;
  console.log(prefix, 'raw is', raw);

  if (raw.isMetaMask) {
    /*
    try {
      const rpc = raw.request || raw.send;
      await rpc('eth_requestAccounts');
    } catch (e) {
      console.error(prefix, e);
      await raw.enable();
    }
    */
    console.log(prefix, 'firing enable');
    await raw.enable();

    const newNetworkData = await loadNetworkMetamask(raw);

    if (account === newNetworkData.account) {
      return provider;
    }

    const result = { ...newNetworkData, raw };

    PubSub.publish('providerAccountChanged', result);
    return result;
  }

  // This method expects the original object returned by one of the provider methods below
  throw new TypeError(`${prefix}: Unknown provider object.`);
};

const normalizeMetamask = async (raw) => {
  const networkData = await loadNetworkMetamask(raw);

  // Legacy API
  if (raw.autoRefreshOnNetworkChange) {
    raw.autoRefreshOnNetworkChange = false;
  }

  raw.on('accountsChanged', () => {
    enable({ ...networkData, raw });
  });

  const handleNetworkChange = async () => {
    const newNetworkData = await loadNetworkMetamask(raw);
    PubSub.publish('providerChainChanged', { ...newNetworkData, raw });
  };

  raw.on('chainChanged', handleNetworkChange);
  // Bug: https://github.com/MetaMask/metamask-extension/issues/8226
  raw.on('chainIdChanged', handleNetworkChange);
  // Legacy API
  raw.on('networkChanged', handleNetworkChange);

  return { ...networkData, raw };
};

// Allow up to 5 seconds for metamask to inject the provider
export const metamaskProvider = (cycle = 50) => new Promise((resolve, reject) => {
  const { ethereum } = window;

  if (ethereum) {
    const { isMetaMask } = ethereum;

    if (isMetaMask) {
      normalizeMetamask(ethereum).then(resolve).catch((e) => {
        console.error(logPrefix('metamaskProvider'), e);
        reject(metamaskError);
      });

      return;
    }

    if (cycle < 60) {
      setTimeout(() => {
        metamaskProvider(cycle + 1).then(resolve, reject);
      }, 500);

      return;
    }

    reject(metamaskError);
  }
});

// Allow up to 30 seconds for metamask to inject the provider
export const metamaskMobileProvider = (cycle = 0) => metamaskProvider(cycle);
