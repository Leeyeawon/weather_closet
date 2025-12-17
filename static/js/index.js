document.addEventListener("DOMContentLoaded", () => {
  // CTA 클릭: 코디 페이지로
  const cta = document.getElementById("ctaBtn");
  if (cta) cta.addEventListener("click", () => (window.location.href = "/coordination"));

  // 최초 1회 로드
  loadUI();

  // 5분마다 갱신
  setInterval(loadUI, 5 * 60 * 1000);
});

async function loadUI() {
  try {
    const res = await fetch("/api/weather", { cache: "no-store" });
    const data = await res.json();

    // 부산 표시(고정)
    const city = document.getElementById("cityText");
    if (city) city.textContent = "부산광역시";

    // ===== 현재 날씨 =====
    if (data.now) {
      const tempEl = document.getElementById("tempText");
      if (tempEl && data.now.temp != null) tempEl.textContent = `${Math.round(data.now.temp)}°C`;

      const feelsEl = document.getElementById("feelsText");
      if (feelsEl && data.feels_c != null) feelsEl.textContent = `체감온도 ${data.feels_c}°C`;

      const humEl = document.getElementById("humText");
      if (humEl && data.now.hum != null) humEl.textContent = `${Math.round(data.now.hum)}%`;

      const windEl = document.getElementById("windText");
      if (windEl && data.now.wind != null) windEl.textContent = `${data.now.wind}m/s`;

      const popEl = document.getElementById("popText");
      if (popEl && data.now.pop != null) popEl.textContent = `${data.now.pop}%`;

      const condEl = document.getElementById("condText");
      if (condEl && data.now.cond_text) condEl.textContent = data.now.cond_text;

      // 아이콘 (현재)
      const icon = data.now.icon || "unknown";
      const iconEl = document.getElementById("weatherIcon");
      if (iconEl) iconEl.src = `/static/img/icons/${icon}.png`;
    }

    // ===== air tip =====
    if (data.air_tip_text) {
      const tipEl = document.getElementById("airTipText");
      if (tipEl) tipEl.innerHTML = String(data.air_tip_text).replace(/\n/g, "<br/>");
    }

    // ===== 내일 미리보기 =====
    if (data.tomorrow) {
      const hi = data.tomorrow.hi;
      const low = data.tomorrow.low;

      const tTempEl = document.getElementById("tomorrowTempText");
      if (tTempEl && hi != null && low != null) tTempEl.textContent = `${hi}°C / ${low}°C`;

      const tCondEl = document.getElementById("tomorrowCondText");
      if (tCondEl && data.tomorrow.cond_text) tCondEl.textContent = data.tomorrow.cond_text;

      const tPopEl = document.getElementById("tomorrowPopText");
      if (tPopEl && data.tomorrow.pop != null) tPopEl.textContent = `${data.tomorrow.pop}%`;

      // (선택) 내일 아이콘도 img로 바꾸면 여기서 동일하게 세팅 가능
      // const tIcon = data.tomorrow.icon || "unknown";
      // document.getElementById("tomorrowIcon").src = `/static/img/icons/${tIcon}.png`;
    }

    // ===== outfit =====
    if (data.outfit_text) {
      const outfitEl = document.getElementById("outfitText");
      if (outfitEl) outfitEl.innerHTML = String(data.outfit_text).replace(/\n/g, "<br/>");
    }
  } catch (e) {
    console.warn("api/weather error:", e);
  }
}
