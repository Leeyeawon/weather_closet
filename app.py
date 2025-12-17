from flask import Flask, render_template, request, jsonify
import os
import requests
import hashlib
from datetime import datetime, timedelta, timezone

# =========================
# timezone (Windows tzdata 이슈 fallback)
# =========================
try:
    from zoneinfo import ZoneInfo
    KST = ZoneInfo("Asia/Seoul")
except Exception:
    KST = timezone(timedelta(hours=9))  # tzdata 없으면 KST 고정(+09:00)

# =========================
# Flask
# =========================
app = Flask(__name__)

# =========================
# 환경 변수
# =========================
KMA_SERVICE_KEY = os.getenv("KMA_SERVICE_KEY", "").strip()
DEFAULT_NX = int(os.getenv("DEFAULT_NX", "98"))
DEFAULT_NY = int(os.getenv("DEFAULT_NY", "76"))
HTTP_TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "7"))

# =========================
# 기상청 API
# =========================
BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
ULTRA_NCST_URL = f"{BASE}/getUltraSrtNcst"
VILAGE_FCST_URL = f"{BASE}/getVilageFcst"
VILAGE_BASE_TIMES = [2, 5, 8, 11, 14, 17, 20, 23]

# =========================
# 캐시(과호출 방지)
# =========================
_CACHE = {}
CACHE_TTL = timedelta(minutes=3)

# =========================
# 내부 유틸
# =========================
def _call(url: str, params: dict) -> dict:
    if not KMA_SERVICE_KEY:
        return {"ok": False, "error": "KMA_SERVICE_KEY(서비스키)가 설정되지 않았어요."}

    base_params = {
        "serviceKey": KMA_SERVICE_KEY,
        "pageNo": 1,
        "numOfRows": 1000,
        "dataType": "JSON",
    }

    try:
        r = requests.get(url, params={**base_params, **params}, timeout=HTTP_TIMEOUT)
        r.raise_for_status()
        data = r.json()

        header = data.get("response", {}).get("header", {})
        if header.get("resultCode") != "00":
            return {"ok": False, "error": header.get("resultMsg", "API 오류"), "raw": data}

        items = (
            data.get("response", {})
                .get("body", {})
                .get("items", {})
                .get("item", [])
        )
        return {"ok": True, "items": items}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def _pick_vilage_base(dt: datetime) -> tuple[str, str]:
    t = dt.astimezone(KST) - timedelta(minutes=10)
    hour = t.hour
    candidates = [h for h in VILAGE_BASE_TIMES if h <= hour]
    if candidates:
        h = max(candidates)
        return t.strftime("%Y%m%d"), f"{h:02d}00"
    prev = t - timedelta(days=1)
    return prev.strftime("%Y%m%d"), "2300"

def _parse_latest(items: list[dict]) -> dict:
    out = {}
    for it in items:
        cat = it.get("category")
        val = it.get("obsrValue") or it.get("fcstValue")
        if cat is not None:
            out[cat] = val
    return out

def get_ultra_now(nx: int, ny: int) -> dict:
    now = datetime.now(KST)

    base_date = now.strftime("%Y%m%d")
    base_time = f"{now.hour:02d}00"
    res = _call(ULTRA_NCST_URL, {"base_date": base_date, "base_time": base_time, "nx": nx, "ny": ny})
    if res.get("ok") and res.get("items"):
        return {"ok": True, "base_date": base_date, "base_time": base_time, "data": _parse_latest(res["items"])}

    back = now - timedelta(hours=1)
    base_date = back.strftime("%Y%m%d")
    base_time = f"{back.hour:02d}00"
    res2 = _call(ULTRA_NCST_URL, {"base_date": base_date, "base_time": base_time, "nx": nx, "ny": ny})
    if res2.get("ok") and res2.get("items"):
        return {"ok": True, "base_date": base_date, "base_time": base_time, "data": _parse_latest(res2["items"])}

    return {"ok": False, "error": res.get("error") or res2.get("error") or "초단기실황 데이터가 비어있어요."}

def get_vilage_forecast(nx: int, ny: int) -> dict:
    base_date, base_time = _pick_vilage_base(datetime.now(KST))
    res = _call(VILAGE_FCST_URL, {"base_date": base_date, "base_time": base_time, "nx": nx, "ny": ny})
    if not res.get("ok"):
        return {"ok": False, "error": res.get("error")}
    return {"ok": True, "base_date": base_date, "base_time": base_time, "items": res.get("items", [])}

# =========================
# 체감온도 계산 + 코디 문장
# =========================
OUTFIT_MESSAGES = {
    "v_cold": [
        "체감 기온이 많이 낮아요.\n롱패딩 + 목도리 + 장갑까지 챙기면 좋아요.",
        "칼바람 체감이에요.\n두꺼운 아우터 + 기모 이너로 보온 우선!",
        "한파 느낌이에요.\n패딩/코트에 귀마개나 넥워머 추천해요.",
        "아주 춥게 느껴질 수 있어요.\n내복/히트텍 같은 레이어드가 좋아요.",
    ],
    "cold": [
        "체감이 쌀쌀해요.\n가벼운 코트나 두꺼운 니트가 좋아요.",
        "바람 때문에 더 춥게 느껴질 수 있어요.\n자켓 + 머플러 추천!",
        "외투는 필수!\n코트/점퍼에 따뜻한 이너로 마무리해요.",
        "손발이 쉽게 차가워질 날씨예요.\n양말/기모 바지 추천해요.",
    ],
    "cool": [
        "선선한 체감이에요.\n가디건/자켓 한 겹 챙기면 딱 좋아요.",
        "아침저녁으로 쌀쌀할 수 있어요.\n얇은 아우터 추천!",
        "니트나 맨투맨에 가벼운 겉옷이면 충분해요.",
        "레이어드하기 좋은 날!\n셔츠 + 니트 조합 추천해요.",
    ],
    "mild": [
        "적당히 포근한 체감이에요.\n긴팔 + 얇은 겉옷이면 좋아요.",
        "활동하기 좋은 날씨!\n가벼운 자켓/셔츠 코디 추천해요.",
        "낮엔 따뜻할 수 있어요.\n겉옷은 탈착 가능한 걸로!",
        "편하게 입기 좋아요.\n맨투맨/셔츠 + 면바지 조합 추천!",
    ],
    "warm": [
        "따뜻한 편이에요.\n얇은 긴팔이나 가벼운 셔츠가 좋아요.",
        "살짝 더울 수 있어요.\n통풍 잘 되는 소재 추천해요.",
        "가벼운 반팔+얇은 겉옷(실내 대비) 조합 좋아요.",
        "활동량 많으면 땀이 날 수도!\n얇고 가벼운 옷 추천해요.",
    ],
    "hot": [
        "덥게 느껴질 수 있어요.\n반팔/얇은 소재로 시원하게!",
        "햇볕이 강할 수 있어요.\n모자/선크림 챙기면 좋아요.",
        "땀나기 쉬운 날씨예요.\n린넨/쿨링 소재 추천!",
        "실내외 온도차 대비해 얇은 가디건 하나면 좋아요.",
    ],
    "v_hot": [
        "체감이 매우 더워요.\n통풍 좋은 반팔/반바지 + 수분 보충!",
        "폭염 느낌이에요.\n밝은 색, 얇은 소재로 가볍게 입어요.",
        "자외선/열기 주의!\n모자 + 선크림 + 양산도 추천해요.",
        "땀이 많이 날 수 있어요.\n여분 티셔츠나 데오드란트도 좋아요.",
    ],
}

def _safe_float(x):
    try:
        return float(x)
    except Exception:
        return None

def calc_feels_c(temp_c, wind_ms, rh):
    if temp_c is None:
        return None
    wind_ms = wind_ms or 0.0

    if temp_c <= 10 and wind_ms > 1.3:
        v_kmh = wind_ms * 3.6
        return 13.12 + 0.6215 * temp_c - 11.37 * (v_kmh ** 0.16) + 0.3965 * temp_c * (v_kmh ** 0.16)

    if temp_c >= 27 and rh is not None:
        T = temp_c * 9/5 + 32
        R = rh
        HI = (-42.379 + 2.04901523*T + 10.14333127*R - 0.22475541*T*R
              - 0.00683783*T*T - 0.05481717*R*R + 0.00122874*T*T*R
              + 0.00085282*T*R*R - 0.00000199*T*T*R*R)
        return (HI - 32) * 5/9

    return temp_c

def band_key(feels_c):
    if feels_c is None:
        return "mild"
    if feels_c < -5: return "v_cold"
    if feels_c < 2:  return "cold"
    if feels_c < 10: return "cool"
    if feels_c < 18: return "mild"
    if feels_c < 24: return "warm"
    if feels_c < 28: return "hot"
    return "v_hot"

def pick_daily_message(band, date_yyyymmdd):
    msgs = OUTFIT_MESSAGES.get(band, OUTFIT_MESSAGES["mild"])
    seed = f"{date_yyyymmdd}:{band}".encode("utf-8")
    idx = int(hashlib.sha256(seed).hexdigest(), 16) % len(msgs)
    return msgs[idx]

# =========================
# forecast에서 값 뽑기 + 상태/아이콘 매핑
# =========================
def _fcst_get(items, fcst_date: str, fcst_time: str, category: str):
    for it in items:
        if it.get("fcstDate") == fcst_date and it.get("fcstTime") == fcst_time and it.get("category") == category:
            return it.get("fcstValue")
    return None

def _weather_text_icon(pty, sky):
    if pty in ("1", "4", "5"):
        return ("비", "rain")
    if pty in ("2", "6"):
        return ("비/눈", "sleet")
    if pty in ("3", "7"):
        return ("눈", "snow")

    if sky == "1":
        return ("맑음", "sun")
    if sky == "3":
        return ("구름많음", "cloud")
    if sky == "4":
        return ("흐림", "overcast")

    return ("-", "unknown")

def _round_to_hour(dt: datetime):
    return dt.replace(minute=0, second=0, microsecond=0)

# =========================
# air tip (기온/바람/습도 기반)
# =========================
AIR_TIPS = {
    "windy": [
        "바람이 강해서 체감 온도가 실제 기온보다 낮게 느껴질 수 있어요.",
        "바람이 세요. 겉옷은 바람막이 계열이 좋아요.",
        "바람이 불어 체감이 더 쌀쌀할 수 있어요. 목/손 보온 추천!",
    ],
    "humid_hot": [
        "습도가 높아서 더 덥고 답답하게 느껴질 수 있어요.",
        "후텁지근할 수 있어요. 통풍 잘 되는 소재가 좋아요.",
        "땀이 마르기 어려운 날! 여벌 티/손수건 챙기면 좋아요.",
    ],
    "dry": [
        "공기가 건조할 수 있어요. 립밤/핸드크림 챙기면 좋아요.",
        "건조해서 피부가 당길 수 있어요. 보습에 신경 써줘요.",
        "건조한 날씨예요. 따뜻한 물 자주 마시기 추천!",
    ],
    "nice": [
        "활동하기 좋은 컨디션이에요. 가볍게 산책해도 좋아요!",
        "전반적으로 무난한 날씨예요. 겉옷은 선택적으로!",
        "컨디션 괜찮아요. 실내외 온도차만 조심해요.",
    ],
}

def pick_tip_daily(key: str, date_yyyymmdd: str):
    msgs = AIR_TIPS.get(key, AIR_TIPS["nice"])
    seed = f"tip:{date_yyyymmdd}:{key}".encode("utf-8")
    idx = int(hashlib.sha256(seed).hexdigest(), 16) % len(msgs)
    return msgs[idx]

def make_air_tip(temp_c, wind_ms, rh, date_yyyymmdd):
    if wind_ms is not None and wind_ms >= 5.0:
        return pick_tip_daily("windy", date_yyyymmdd)
    if temp_c is not None and temp_c >= 25 and rh is not None and rh >= 70:
        return pick_tip_daily("humid_hot", date_yyyymmdd)
    if rh is not None and rh <= 35:
        return pick_tip_daily("dry", date_yyyymmdd)
    return pick_tip_daily("nice", date_yyyymmdd)

# =========================
# 페이지 라우트
# =========================
@app.get("/")
def index():
    return render_template("index.html", active_page="home")

@app.get("/coordination")
def coordination():
    return render_template("coordination.html", active_page="codi")

@app.get("/closet")
def closet():
    return render_template("closet.html", active_page="closet")

@app.get("/mypage")
def mypage():
    return render_template("mypage.html", active_page="profile")

# =========================
# API 라우트
# =========================
@app.get("/api/weather")
def api_weather():
    nx = int(request.args.get("nx", DEFAULT_NX))
    ny = int(request.args.get("ny", DEFAULT_NY))
    key = f"{nx},{ny}"

    now = datetime.now(KST)
    if key in _CACHE and (now - _CACHE[key]["ts"]) < CACHE_TTL:
        return jsonify({"ok": True, "cached": True, **_CACHE[key]["data"]})

    nowcast = get_ultra_now(nx, ny)
    forecast = get_vilage_forecast(nx, ny)

    # nowcast 기본값
    d = nowcast.get("data", {}) if nowcast.get("ok") else {}
    temp_c = _safe_float(d.get("T1H"))
    wind_ms = _safe_float(d.get("WSD"))
    rh = _safe_float(d.get("REH"))

    # 체감/코디 문구
    today = now.strftime("%Y%m%d")
    feels_c = calc_feels_c(temp_c, wind_ms, rh)
    outfit_text = pick_daily_message(band_key(feels_c), today) if feels_c is not None else "날씨 정보를 불러오는 중이에요."

    # air tip 문구
    air_tip_text = make_air_tip(temp_c, wind_ms, rh, today)

    # forecast에서 현재 POP/상태, 내일 요약 만들기
    items = forecast.get("items", []) if forecast.get("ok") else []

    now_pop = None
    now_cond_text, now_icon = ("-", "unknown")
    tmr_hi = tmr_low = None
    tmr_pop = None
    tmr_cond_text, tmr_icon = ("-", "unknown")

    if items:
        now_dt = _round_to_hour(now)
        fcst_date = now_dt.strftime("%Y%m%d")
        fcst_time = now_dt.strftime("%H00")

        now_pop_v = _fcst_get(items, fcst_date, fcst_time, "POP")
        now_pop = None if now_pop_v is None else int(float(now_pop_v))

        now_sky = _fcst_get(items, fcst_date, fcst_time, "SKY")
        now_pty = _fcst_get(items, fcst_date, fcst_time, "PTY")
        now_cond_text, now_icon = _weather_text_icon(now_pty, now_sky)

        tmr = (now_dt + timedelta(days=1)).strftime("%Y%m%d")

        tmr_tmp_list = []
        for it in items:
            if it.get("fcstDate") == tmr and it.get("category") == "TMP":
                v = _safe_float(it.get("fcstValue"))
                if v is not None:
                    tmr_tmp_list.append(v)

        if tmr_tmp_list:
            tmr_hi = round(max(tmr_tmp_list))
            tmr_low = round(min(tmr_tmp_list))

        tmr_time = "1200"
        tmr_pop_v = _fcst_get(items, tmr, tmr_time, "POP")
        tmr_pop = None if tmr_pop_v is None else int(float(tmr_pop_v))

        tmr_sky = _fcst_get(items, tmr, tmr_time, "SKY")
        tmr_pty = _fcst_get(items, tmr, tmr_time, "PTY")
        tmr_cond_text, tmr_icon = _weather_text_icon(tmr_pty, tmr_sky)

    payload = {
        "nx": nx,
        "ny": ny,

        # 원본(디버깅/확장용)
        "nowcast": nowcast,
        "forecast": forecast,

        # 화면에 바로 꽂을 요약값
        "now": {
            "temp": temp_c,
            "hum": rh,
            "wind": wind_ms,
            "pop": now_pop,
            "cond_text": now_cond_text,
            "icon": now_icon,
        },
        "tomorrow": {
            "hi": tmr_hi,
            "low": tmr_low,
            "pop": tmr_pop,
            "cond_text": tmr_cond_text,
            "icon": tmr_icon,
        },

        "feels_c": None if feels_c is None else round(feels_c),
        "outfit_text": outfit_text,
        "air_tip_text": air_tip_text,
    }

    _CACHE[key] = {"ts": now, "data": payload}
    return jsonify({"ok": True, "cached": False, **payload})

if __name__ == "__main__":
    app.run(debug=True)
