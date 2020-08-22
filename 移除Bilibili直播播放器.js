// ==UserScript==
// @name         移除Bilibili直播播放器
// @namespace    SeaLoong
// @version      0.1
// @description  自用脚本
// @author       SeaLoong
// @include      /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
// @grant        unsafeWindow
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==

'use strict';

if (typeof unsafeWindow !== 'undefined') {
  const safeWindow = window;
  window = unsafeWindow; // eslint-disable-line no-global-assign
  window.safeWindow = safeWindow;
}

(function () {
  let isRemove = false;
  const controllers = [];
  const urlSet = new Set();
  const wfetch = window.fetch;
  window.fetch = (input, init) => new Promise((resolve, reject) => {
    let url = input;
    if (typeof Request !== 'undefined' && input instanceof Request) url = input.url;
    if (!url.includes('//data.bilibili.com') && url.includes('bilivideo.com')) {
      if (isRemove) return;
      urlSet.add(url);
      if (!init) init = {};
      const controller = new AbortController();
      controllers.push(controller);
      if (init.signal) {
        const _onabort = init.signal.onabort;
        init.signal.onabort = function (...args) {
          controller.abort.apply(this, args);
          if (_onabort instanceof Function) return _onabort.apply(this, args);
        };
      }
      init.signal = controller.signal;
    }
    wfetch(input, init).then(resolve, function (reason) {
      if (urlSet.has(url)) return;
      return reject.call(this, reason);
    });
  });
  (async () => {
    const id = await GM.registerMenuCommand('移除', async () => {
      if (isRemove) return;
      isRemove = true;
      document.getElementById('live-player').remove();
      controllers.forEach(v => v.abort());
      await GM.unregisterMenuCommand(id);
    });
  })();
})();
