(function () {
  const rows = document.querySelectorAll(".cleanup-row");
  const modeRadios = document.querySelectorAll('input[name="mode"]');

  let currentMode = "discard";

  modeRadios.forEach(r => {
    r.addEventListener("change", () => {
      currentMode = r.value;
    });
  });

  // 각 행: discard / donate는 서로 배타
  rows.forEach(row => {
    const picks = row.querySelectorAll(".pick");

    picks.forEach(chk => {
      chk.addEventListener("change", () => {
        if (chk.checked) {
          picks.forEach(other => {
            if (other !== chk) other.checked = false;
          });
        }
      });
    });

    // 행 탭하면 현재 모드로 토글(모바일 편의)
    row.addEventListener("click", (e) => {
      if (e.target.closest("input") || e.target.closest("label") || e.target.closest("button") || e.target.closest("a")) {
        return;
      }
      const target = row.querySelector(`.pick[data-kind="${currentMode}"]`);
      const other = row.querySelector(`.pick[data-kind="${currentMode === "discard" ? "donate" : "discard"}"]`);
      if (!target) return;

      target.checked = !target.checked;
      if (target.checked && other) other.checked = false;
    });
  });
})();
