document.addEventListener("DOMContentLoaded", () => {
  const cta = document.getElementById("ctaBtn");
  if (cta) cta.addEventListener("click", () => (window.location.href = "/coordination"));

  loadUI();
  setInterval(loadUI, 5 * 60 * 1000);
});

async function loadUI() {
  try {
    const res = await fetch("/api/weather", { cache: "no-store" });
    const data = await res.json();

    // 도시(고정)
    const city = document.getElementById("cityText");
    if (city) city.textContent = "부산광역시";

    // ===== 현재 =====
    if (data.now) {
      if (data.now.temp != null) document.getElementById("tempText").textContent = `${Math.round(data.now.temp)}°C`;
      if (data.feels_c != null) document.getElementById("feelsText").textContent = `체감온도 ${data.feels_c}°C`;

      if (data.now.hum != null) document.getElementById("humText").textContent = `${Math.round(data.now.hum)}%`;
      if (data.now.wind != null) document.getElementById("windText").textContent = `${data.now.wind}m/s`;
      if (data.now.pop != null) document.getElementById("popText").textContent = `${data.now.pop}%`;

      if (data.now.cond_text) document.getElementById("condText").textContent = data.now.cond_text;

      // 현재 아이콘
      if (data.now.icon && document.getElementById("weatherIcon")) {
        document.getElementById("weatherIcon").src = `/static/img/icons/${data.now.icon}.png`;
      }
    }

    // ===== 오늘 코디 문구 =====
    if (data.outfit_text && document.getElementById("outfitText")) {
      document.getElementById("outfitText").innerHTML = String(data.outfit_text).replace(/\n/g, "<br/>");
    }

    // ===== 대기질/컨디션 팁 =====
    if (data.air_tip_text && document.getElementById("airTipText")) {
      document.getElementById("airTipText").innerHTML = String(data.air_tip_text).replace(/\n/g, "<br/>");
    }

    // ===== 내일 미리보기 =====
    if (data.tomorrow) {
      const hi = data.tomorrow.hi;
      const low = data.tomorrow.low;

      if (hi != null && low != null && document.getElementById("tomorrowTempText")) {
        document.getElementById("tomorrowTempText").textContent = `${hi}°C / ${low}°C`;
      }
      if (data.tomorrow.cond_text && document.getElementById("tomorrowCondText")) {
        document.getElementById("tomorrowCondText").textContent = data.tomorrow.cond_text;
      }
      if (data.tomorrow.pop != null && document.getElementById("tomorrowPopText")) {
        document.getElementById("tomorrowPopText").textContent = `${data.tomorrow.pop}%`;
      }

      // 내일 아이콘(이미지로 쓸 때)
      if (data.tomorrow.icon && document.getElementById("tomorrowIcon")) {
        document.getElementById("tomorrowIcon").src = `/static/img/icons/${data.tomorrow.icon}.png`;
      }
    }

    // ===== 내일 코디 힌트(추가) =====
    if (data.tomorrow_tip_text && document.getElementById("tomorrowTipText")) {
      document.getElementById("tomorrowTipText").innerHTML = String(data.tomorrow_tip_text).replace(/\n/g, "<br/>");
    }

  } catch (e) {
    console.warn("api/weather error:", e);
  }
}
