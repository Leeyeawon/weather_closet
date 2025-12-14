(function () {
  // pill remove
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-pill]");
    if (!btn) return;
    const pill = btn.closest(".pill");
    if (pill) pill.remove();
  });

  // add pill
  const form = document.getElementById("avoidAddForm");
  const input = document.getElementById("avoidInput");
  const wrap = document.getElementById("avoidPills");

  if (form && input && wrap) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (input.value || "").trim();
      if (!v) return;

      // 중복 방지
      const exists = [...wrap.querySelectorAll(".pill")]
        .some(p => p.firstChild && p.firstChild.textContent.trim() === v);
      if (exists) { input.value = ""; return; }

      const pill = document.createElement("span");
      pill.className = "pill";
      pill.innerHTML = `
        ${escapeHtml(v)}
        <button class="pill-x" type="button" aria-label="삭제" data-remove-pill>✕</button>
      `;
      wrap.appendChild(pill);
      input.value = "";
    });
  }

  // slider hint
  const s1 = document.getElementById("s1");
  const s2 = document.getElementById("s2");
  const hint = document.getElementById("sliderHint");

  function labelFor(v, left, right) {
    const n = Number(v);
    if (n < 34) return left;
    if (n > 66) return right;
    return "중간";
  }

  function updateHint() {
    if (!hint) return;
    const a = s1 ? labelFor(s1.value, "캐주얼", "포멀") : "-";
    const b = s2 ? labelFor(s2.value, "심플", "러블리") : "-";
    hint.textContent = `${a} · ${b}`;
  }

  if (s1) s1.addEventListener("input", updateHint);
  if (s2) s2.addEventListener("input", updateHint);
  updateHint();

  function escapeHtml(str) {
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
