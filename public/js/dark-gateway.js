/**
 * 演出のみ（外部通信なし）。アドグル検索とは無関係。
 */
(function () {
  function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function tick() {
    var conn = document.getElementById("dw-conn");
    var lat = document.getElementById("dw-lat");
    if (conn) conn.textContent = "SESSION: RELAY_OK / hop=" + rnd(3, 11);
    if (lat) lat.textContent = "LATENCY: " + rnd(36, 220) + "ms (simulated)";
  }

  tick();
  setInterval(tick, 4200);
})();
