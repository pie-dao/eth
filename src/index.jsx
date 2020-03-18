import { defaultNetwork } from './config';
import { eth as store } from './store';
import { isAddress, shortenAddress, validateAddress } from './utils/address';

import ConnectButtonComponent from './components/ConnectButton';
import ConnectModalComponent from './components/ConnectModal';
import EthProviderComponent from './components/EthProvider';

export const ConnectButton = ConnectButtonComponent;
export const ConnectModal = ConnectModalComponent;
export const config = { defaultNetwork };
export const eth = store;
export const EthProvider = EthProviderComponent;
export const utils = {
  address: { isAddress, shortenAddress, validateAddress },
};
