document.addEventListener("DOMContentLoaded", () => {
  // 최초 로드
  loadCoordinationUI();

  // 5분마다 갱신
  setInterval(loadCoordinationUI, 5 * 60 * 1000);

  // "다른 아이템 보기" (임시 로테이션)
  const itemBtn = document.getElementById("itemMoreBtn");
  if (itemBtn) itemBtn.addEventListener("click", rotateItem);

  // "즐겨찾기 저장" (아직 서버 저장 없으면 알림만)
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) saveBtn.addEventListener("click", () => alert("즐겨찾기 저장 기능은 다음 단계에서 DB로 연결하면 돼!"));
});

/** 날짜 포맷: YYYY.MM.DD (요일) */
function formatKoreanDate(d) {
  const yoil = ["일","월","화","수","목","금","토"];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} (${yoil[d.getDay()]})`;
}

async function loadCoordinationUI() {
  try {
    const res = await fetch("/api/weather", { cache: "no-store" });
    const data = await res.json();

    // 부산 고정
    const cityEl = document.getElementById("cityText");
    if (cityEl) cityEl.textContent = "부산광역시";

    // 오늘 날짜
    const dateEl = document.getElementById("dateText");
    if (dateEl) dateEl.textContent = formatKoreanDate(new Date());

    // ===== 현재 =====
    if (data.now) {
      if (data.now.temp != null) setText("tempText", `${Math.round(data.now.temp)}°C`);
      if (data.feels_c != null) setText("feelsText", `체감 ${data.feels_c}°C`);
      if (data.now.hum != null) setText("humText", `${Math.round(data.now.hum)}%`);
      if (data.now.wind != null) setText("windText", `${data.now.wind}m/s`);
      if (data.now.pop != null) setText("popText", `${data.now.pop}%`);
    }

    // ⚠️ pm10/pm25/uv는 현재 너의 /api/weather payload에 "실제 값"이 없어서
    // 지금은 화면에서 "기본 텍스트"가 유지될 거야.
    // 나중에 API 붙이면 여기서 setText("pm10Text", ... )만 하면 자동 연동됨.

    // ===== 내일 =====
    if (data.tomorrow) {
      // 내일 날짜
      const tmrDate = new Date();
      tmrDate.setDate(tmrDate.getDate() + 1);
      setText("tmrDateText", formatKoreanDate(tmrDate));

      // 내일 단일 온도(디자인이 1개라서 low 우선)
      const tVal = (data.tomorrow.low != null) ? data.tomorrow.low
                 : (data.tomorrow.hi != null) ? data.tomorrow.hi
                 : null;

      if (tVal != null) setText("tmrTempText", `${tVal}°C`);

      // 오늘 vs 내일 차이 문구
      const nowTemp = data.now?.temp;
      if (nowTemp != null && tVal != null) {
        const diff = Math.round(tVal - nowTemp); // 내일-오늘
        const abs = Math.abs(diff);
        if (diff < 0) setText("tmrDeltaText", `오늘보다 ${abs}°C 낮음`);
        else if (diff > 0) setText("tmrDeltaText", `오늘보다 ${abs}°C 높음`);
        else setText("tmrDeltaText", `오늘과 비슷함`);

        // 코디 힌트 (간단 규칙)
        setText("tmrHintText", makeTomorrowHint(diff));
      }
    }

  } catch (e) {
    console.warn("coordination api/weather error:", e);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function makeTomorrowHint(diff) {
  if (diff <= -4) return "내일은 오늘보다 꽤 더 추워요. 한 단계 두꺼운 아우터 + 목 보온을 추천해요.";
  if (diff <= -2) return "내일은 오늘보다 더 추워요. 오늘보다 조금 더 따뜻한 겉옷을 준비해보세요.";
  if (diff >= 4)  return "내일은 오늘보다 꽤 더 따뜻해요. 이너를 가볍게 하거나 겉옷은 얇게 추천해요.";
  if (diff >= 2)  return "내일은 오늘보다 조금 더 따뜻해요. 겉옷은 가볍게 조절해도 좋아요.";
  return "내일은 오늘과 비슷한 체감이에요. 실내외 온도차만 조심해요.";
}

/* ===== 임시: 오늘의 아이템 로테이션(나중에 DB/시트로 교체 가능) ===== */
const ITEMS = [
  {
    name: "크림 니트",
    desc: "오늘 같은 쌀쌀한 날씨에 딱 맞는 따뜻하고 부드러운 니트예요. 심플한 디자인으로 다양한 코디에 활용하기 좋아요.",
    img: "https://placehold.co/299x190"
  },
  {
    name: "숏 패딩",
    desc: "바람이 부는 날엔 보온이 중요해요. 가벼운 숏패딩으로 활동성도 챙겨보세요.",
    img: "https://placehold.co/299x190"
  },
  {
    name: "후드 집업",
    desc: "간절기/실내외 온도차가 있을 때 툭 걸치기 좋아요. 레이어드에도 잘 어울려요.",
    img: "https://placehold.co/299x190"
  },
];

let itemIndex = 0;
function rotateItem() {
  itemIndex = (itemIndex + 1) % ITEMS.length;
  const it = ITEMS[itemIndex];

  const imgEl = document.getElementById("itemImg");
  if (imgEl) imgEl.src = it.img;

  setText("itemName", it.name);

  const descEl = document.getElementById("itemDesc");
  if (descEl) descEl.textContent = it.desc;

  setText("itemPageText", `${itemIndex + 1}/${ITEMS.length}`);
}
