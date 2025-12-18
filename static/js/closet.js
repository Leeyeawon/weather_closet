document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("cleanupList");
  const btn = document.getElementById("cleanupBtn");

  // 체크 토글(한 아이템에서 trash/donate 중 하나만 선택되게)
  list?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.classList.contains("chk")) return;

    const item = t.closest(".cleanup-item");
    if (!item) return;

    const kind = t.dataset.kind; // trash | donate
    const trashBtn = item.querySelector('.chk[data-kind="trash"]');
    const donateBtn = item.querySelector('.chk[data-kind="donate"]');

    if (kind === "trash") {
      trashBtn?.classList.toggle("is-on");
      donateBtn?.classList.remove("is-on");
    } else if (kind === "donate") {
      donateBtn?.classList.toggle("is-on");
      trashBtn?.classList.remove("is-on");
    }
  });

  // 선택한 아이템 정리하기
  btn?.addEventListener("click", () => {
    const items = Array.from(document.querySelectorAll(".cleanup-item")).map((el) => {
      const id = el.getAttribute("data-id");
      const isTrash = el.querySelector('.chk[data-kind="trash"]')?.classList.contains("is-on");
      const isDonate = el.querySelector('.chk[data-kind="donate"]')?.classList.contains("is-on");

      let action = null;
      if (isTrash) action = "trash";
      if (isDonate) action = "donate";

      return { id, action };
    }).filter(x => x.action);

    if (!items.length) {
      alert("정리할 아이템을 선택해줘!");
      return;
    }

    // 다음 단계: 여기서 fetch("/api/closet/cleanup", {method:"POST", body: JSON.stringify(items)}) 붙이면 됨
    alert("선택됨: " + JSON.stringify(items, null, 2));
  });
});
