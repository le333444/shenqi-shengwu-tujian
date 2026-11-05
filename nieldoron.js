/* ===========================================================
   尼尔多龙（蛋）· 与龙蛋对话
   龙蛋听力不好：只听得清第一个字和后面随机一个字，
   中间的内容一律用省略号代替，末尾补一个问号。
   =========================================================== */
(function () {
  'use strict';

  var PUNCT = '，。！？、,.!?~～…：；;:「」“”‘’()（） \n\t';

  function garble(text) {
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (PUNCT.indexOf(c) !== -1) { continue; }
      chars.push(c);
    }
    if (!chars.length) { return '…？'; }
    if (chars.length <= 2) { return chars[0] + '…？'; }

    var keepCount = chars.length >= 8 ? 3 : 2;
    var kept = [0];
    var pool = [];
    // 从第三个字起才参与抽取，保证中间一定有字被吃掉
    for (var j = 2; j < chars.length; j++) { pool.push(j); }
    while (kept.length < keepCount && pool.length) {
      var k = Math.floor(Math.random() * pool.length);
      kept.push(pool.splice(k, 1)[0]);
    }
    kept.sort(function (a, b) { return a - b; });

    var out = kept.map(function (idx) { return chars[idx]; }).join('…');
    return out + '？';
  }

  // 便于离线核对（页面本身不依赖它）
  window.NieldoronGarble = garble;

  var form = document.getElementById('talk-form');
  var input = document.getElementById('talk-input');
  var bubble = document.getElementById('egg-bubble');
  var readout = document.getElementById('talk-readout');
  var stage = document.getElementById('egg-stage');
  if (!form || !input || !bubble || !readout || !stage) { return; }

  var BUBBLE_MS = 5000;
  var IDLE_TEXT = '⋯';
  var timer = null;

  function hideBubble() {
    bubble.classList.remove('show');
    bubble.textContent = IDLE_TEXT;
    stage.classList.remove('is-speaking');
  }

  function showBubble(text) {
    bubble.textContent = text;
    bubble.classList.add('show');
    stage.classList.remove('is-speaking');
    void stage.offsetWidth;
    stage.classList.add('is-speaking');
    if (timer) { clearTimeout(timer); }
    timer = setTimeout(hideBubble, BUBBLE_MS);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var said = (input.value || '').replace(/^\s+|\s+$/g, '');
    if (!said) {
      readout.textContent = '它没有听见任何东西，只是原地晃了一下。';
      hideBubble();
      return;
    }
    var heard = garble(said);
    showBubble(heard);
    readout.textContent = '你说：「' + said + '」　它听到的是：「' + heard + '」';
  });
})();
