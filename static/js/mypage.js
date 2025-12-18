document.addEventListener("DOMContentLoaded", () => {
  // 회피 아이템 x 버튼 (임시: 화면에서만 제거)
  document.getElementById("avoidPills")?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.classList.contains("x")) return;

    const pill = t.closest(".pill");
    pill?.remove();
  });

  // 회피 아이템 추가 (임시)
  document.getElementById("avoidAddBtn")?.addEventListener("click", () => {
    const v = prompt("추가할 회피 아이템을 입력해줘 (예: 민소매)");
    if (!v) return;

    const row = document.getElementById("avoidPills");
    if (!row) return;

    const span = document.createElement("span");
    span.className = "pill";
    span.innerHTML = `${escapeHtml(v)} <button class="x" type="button" aria-label="삭제">×</button>`;
    row.appendChild(span);
  });
});

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
