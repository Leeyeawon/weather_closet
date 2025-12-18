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

    const tHi = (data.tomorrow.hi != null) ? Number(data.tomorrow.hi) : null;
    const tLow = (data.tomorrow.low != null) ? Number(data.tomorrow.low) : null;
    const tPop = (data.tomorrow.pop != null) ? Number(data.tomorrow.pop) : null;

    // ✅ 내일 표시 온도(디자인이 1개라서 low 우선)
    const tDisplay = (tLow != null) ? tLow : (tHi != null ? tHi : null);
    if (tDisplay != null) setText("tmrTempText", `${Math.round(tDisplay)}°C`);

    // ✅ 내일 강수확률
    if (tPop != null) setText("tmrPopText", `${Math.round(tPop)}%`);

    // ✅ 오늘 vs 내일 기온차 (가능하면 내일 평균(hi+low)/2로 비교)
    const nowTemp = (data.now?.temp != null) ? Number(data.now.temp) : null;
    const tCompare = (tHi != null && tLow != null) ? (tHi + tLow) / 2 : tDisplay;

    if (nowTemp != null && tCompare != null) {
      const diff = Math.round(tCompare - nowTemp); // 내일-오늘
      const abs = Math.abs(diff);

      if (diff < 0) setText("tmrDeltaText", `오늘보다 ${abs}°C 낮음`);
      else if (diff > 0) setText("tmrDeltaText", `오늘보다 ${abs}°C 높음`);
      else setText("tmrDeltaText", `오늘과 비슷함`);

      // ✅ 내일 코디 힌트: "기온" 중심 + "강수확률" 보정
      setText("tmrHintText", makeTomorrowHintByTemp(tCompare, tPop, data.tomorrow.cond_text));
    } else {
      // 비교 불가해도 힌트는 온도로만 생성
      if (tCompare != null) {
        setText("tmrHintText", makeTomorrowHintByTemp(tCompare, tPop, data.tomorrow.cond_text));
      }
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

function makeTomorrowHintByTemp(tempC, pop, condText) {
  const t = Number(tempC);
  const p = (pop == null) ? null : Number(pop);
  const cond = String(condText || "");

  // 비/눈 가능성 높으면 우선 안내
  const rainLikely = (p != null && p >= 60) || /비|눈|소나기/.test(cond);
  if (rainLikely) {
    if (t <= 5) return "내일은 비/눈 가능성이 있어요. 방수되는 아우터 + 미끄럼 주의 신발을 추천해요.";
    return "내일은 비 올 가능성이 있어요. 우산 + 방수 아우터/신발을 준비해보세요.";
  }

  // 기온대별 코디 힌트
  if (t <= -3) return "내일은 매우 추워요. 롱패딩/두꺼운 코트 + 목도리/장갑까지 챙겨요.";
  if (t <= 2)  return "내일은 체감이 차가워요. 패딩/코트 + 머플러 조합 추천해요.";
  if (t <= 8)  return "내일은 쌀쌀한 편이에요. 코트/두꺼운 니트 + 긴바지로 따뜻하게 입어요.";
  if (t <= 13) return "내일은 선선해요. 자켓/가디건 한 겹 챙기면 좋아요.";
  if (t <= 18) return "내일은 무난한 날씨예요. 긴팔 + 얇은 겉옷이면 충분해요.";
  if (t <= 24) return "내일은 따뜻한 편이에요. 가벼운 셔츠/긴팔 위주로, 겉옷은 선택!";
  return "내일은 더울 수 있어요. 통풍 좋은 옷으로 가볍게 입고, 햇빛 대비도 해주세요.";
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

