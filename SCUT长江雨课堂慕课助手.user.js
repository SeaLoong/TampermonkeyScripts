// ==UserScript==
// @name         SCUT长江雨课堂慕课助手
// @namespace    SeaLoong
// @version      0.1
// @description  自用脚本
// @author       SeaLoong
// @include      /^https?:\/\/scut\.yuketang\.cn\/pro\/lms\/[^/]+\/\d+\/homework\/\d+.*$/
// @grant        unsafeWindow
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @run-at       document-idle
// @require      https://unpkg.com/sweetalert/dist/sweetalert.min.js
// ==/UserScript==

/* eslint-disable camelcase */

'use strict';

if (!/^https?:\/\/scut\.yuketang\.cn\/pro\/lms\/[^/]+\/\d+\/homework\/\d+.*$/.test(location.href)) return;

if (typeof unsafeWindow !== 'undefined') {
  const safeWindow = window;
  window = unsafeWindow; // eslint-disable-line no-global-assign
  window.safeWindow = safeWindow;
}

(function () {
  function getCookie (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
  }
  let uv_id = getCookie('university_id');
  let csrftoken = getCookie('csrftoken');

  const match = /pro\/lms\/([^/]+)\/(\d+)\/homework\/(\d+).*$/.exec(location.pathname);
  let sign = match[1];
  let classroom_id = parseInt(match[2], 10);
  let section_leaf_id = parseInt(match[3], 10);

  async function get_leaf_type_id () {
    const r = await fetch(`https://scut.yuketang.cn/mooc-api/v1/lms/learn/leaf_info/${classroom_id}/${section_leaf_id}/?sign=${sign}&term=latest&uv_id=${uv_id}`, {
      method: 'GET',
      headers: {
        'university-id': uv_id,
        'x-csrftoken': csrftoken,
        xtbz: 'cloud'
      },
      credentials: 'include'
    });
    const obj = await r.json();
    return obj.data.content_info.leaf_type_id;
  }

  async function get_answer_obj (leaf_type_id) {
    const r = await fetch(`https://scut.yuketang.cn/mooc-api/v1/lms/exercise/get_exercise_list/${leaf_type_id}/?term=latest&uv_id=${uv_id}`, {
      method: 'GET',
      headers: {
        'university-id': uv_id,
        'x-csrftoken': csrftoken,
        xtbz: 'cloud'
      },
      credentials: 'include'
    });
    return r.json();
  }

  async function problem_apply (body) {
    const r = await fetch('https://scut.yuketang.cn/mooc-api/v1/lms/exercise/problem_apply/?term=latest&uv_id=' + uv_id, {
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'university-id': uv_id,
        'x-csrftoken': csrftoken,
        xtbz: 'cloud'
      },
      credentials: 'include',
      body
    });
    if (r.status !== 200) return r.text();
  }

  (async function () {
    await GM.registerMenuCommand('答题', async () => {
      if (!/^https?:\/\/scut\.yuketang\.cn\/pro\/lms\/[^/]+\/\d+\/homework\/\d+.*$/.test(location.href)) return;
      uv_id = getCookie('university_id');
      csrftoken = getCookie('csrftoken');

      const match = /pro\/lms\/([^/]+)\/(\d+)\/homework\/(\d+).*$/.exec(location.pathname);
      sign = match[1];
      classroom_id = parseInt(match[2], 10);
      section_leaf_id = parseInt(match[3], 10);

      const leaf_type_id = await get_leaf_type_id();

      const answerObj = await get_answer_obj(leaf_type_id);

      for (const problem of answerObj.data.problems) {
        if (problem.user.count <= problem.user.my_count) continue;
        const body = JSON.stringify({
          classroom_id: classroom_id,
          problem_id: problem.problem_id,
          answer: problem.user.answer || problem.user.answers
        });
        /* globals swal */
        if (await swal({
          title: '确认提交？',
          text: problem.index + '\n' + problem.content.Body + '\n' + JSON.stringify(problem.content.Options) + '\n' + body,
          icon: 'info',
          buttons: true
        })) {
          const r = await problem_apply(body);
          if (r) {
            swal(r);
            return;
          }
        } else {
          return;
        }
      }
      await swal({
        title: '提示',
        text: '已完成',
        icon: 'info'
      });
    });
  })();
})();
