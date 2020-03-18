import Notify from 'bnc-notify';

const warn = () => {
  console.warn('Blocknative not initialized. Did you pass a blocknativeDappId to eth.init?');
};

class BlocknativeAdapter {
  constructor() {
    this.connected = false;
  }

  initialize(dappId, networkId) {
    if (!dappId) {
      return;
    }

    this._notify = Notify({ dappId, networkId });
    this.connected = true;
  }

  dismissError() {
    if (this._error) {
      try {
        this._error.dismiss();
        delete this._error;
      } catch (e) {
        delete this._error;
      }
    }
  }

  notify(hash) {
    if (!this.connected) {
      warn();
      return { hash };
    }

    const { emitter } = this._notify.hash(hash);
    return { emitter, hash };
  }

  setError({ message, eventCode = 'error', type = 'error' }) {
    if (!this.connected) {
      warn();
      return;
    }

    this._error = this._notify.notification({ eventCode, type, message });
  }
}

export default new BlocknativeAdapter();
