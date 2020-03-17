import { ethers } from 'ethers';
import { store } from 'react-easy-state';
import Notify from 'bnc-notify';

const defaultNetwork = 'mainnet';

const internal = {
  dappId: undefined,
  provider: undefined,
  network: {},
  notify: undefined,
};

const initializeNotify = () => {
  const { dappId, network } = internal;
  const networkId = network.chainId;

  internal.notify = Notify({ dappId, networkId });
};

const eth = store({
  accountProvider: undefined,
  networkId: undefined,
  provider: undefined,

  init: async ({ dappId, network = defaultNetwork }) => {
    internal.dappId = dappId;
    internal.provider = ethers.getDefaultProvider(network);
    internal.network = await internal.provider.getNetwork();

    eth.networkId = internal.network.chainId;

    initializeNotify();
  },
});

const config = { defaultNetwork };
const eth$1 = eth;

export { config, eth$1 as eth };
