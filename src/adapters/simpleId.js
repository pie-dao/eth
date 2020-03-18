import SimpleId from 'simpleid-js-sdk';

class SimpleIdAdapter {
  constructor() {
    this.connected = false;
  }

  initialize(appId, network) {
    if (!appId) {
      return;
    }

    this._simpleId = new SimpleId({
      appId,
      network,

      appName: 'PieDAO',
      appOrigin: window.location.origin,
      renderNotifications: true,
    });
  }

  user(info) {
    if (!this.connected) {
      return;
    }

    this._simpleId.passUserInfo(info);
  }
}

export default new SimpleIdAdapter();
