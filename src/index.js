import gasPrices, { currentGasPrices } from './adapters/ethGasStation';
import { defaultNetwork } from './config';
import { eth as store } from './store';

import ConnectButtonComponent from './components/ConnectButton';
import ConnectModalComponent from './components/ConnectModal';

export const ConnectButton = ConnectButtonComponent;
export const ConnectModal = ConnectModalComponent;
export const config = { defaultNetwork };
export const eth = store;
export const gas = { currentGasPrices, gasPrices };
