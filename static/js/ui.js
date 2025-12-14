(function () {
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 250);
    }, 1200);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toast]");
    if (!btn) return;
    toast(btn.getAttribute("data-toast"));
  });
})();
