from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)
app.secret_key = "dev-secret"  # 데모용 (배포 시 환경변수로)

@app.route("/")
def index():
    data = {
        "location": "서울특별시 강남구",
        "now": {
            "temp": 12,
            "feels": 9,
            "desc": "맑음",
            "humidity": 65,
            "pop": 20,
            "wind": 2.3,
            "uv": "보통",
        },
        "air": {
            "pm10": "나쁨",
            "pm25": "보통",
            "message": "바람이 조금 불어서 체감 온도가 실제 기온보다 낮게 느껴질 수 있어요."
        },
        "tomorrow": {
            "max": 15,
            "min": 8,
            "desc": "흐림",
            "pop": 40,
        },
        "style_hint": '체감 기온 9℃ 기준, 가벼운 코트나 두꺼운 <br/>니트가 어울리는 날이에요.'
    }
    return render_template("index.html", data=data, active="home")

@app.route("/coordination")
def coordination():
    data = {
        "location": "서울 강남구",
        "date": "2025.12.10 (수)",
        "temp": 8,
        "feels_like": 5,
        "humidity": 65,
        "wind": "2.5m/s",
        "rain_prob": 10,
        "pm10": "나쁨",
        "pm25": "보통",
        "uv": "낮음",
        "item": {
            "name": "크림 니트",
            "desc": "오늘 같은 쌀쌀한 날씨에 딱 맞는 따뜻하고 부드러운 니트예요. 심플한 디자인으로 다양한 코디에 활용하기 좋아요.",
            "img": "https://placehold.co/299x190"
        },
        "health_cards": [
            {"title": "마스크 착용 권장", "desc": "미세먼지가 나쁜 날이에요. 마스크를 꼭 챙겨보세요."},
            {"title": "자외선 차단", "desc": "오늘은 자외선이 낮지만, 외출 시 선크림을 바르는 것을 추천해요."},
        ],
        "prefs": {
            "avoid": ["민소매", "반바지", "탑"],
            "style": ["캐주얼", "심플"]
        },
        "outfit": {
            "img": "https://placehold.co/335x256",
            "top": "크림 니트",
            "bottom": "흑청 데님",
            "outer": "숏 패딩",
            "shoes": "화이트 스니커즈",
        },
        "tomorrow": {
            "date": "2025.01.16 (목)",
            "temp": 5,
            "diff": "오늘보다 3°C 낮음",
            "rain_prob": 70,
            "wind": "3m/s",
            "uv": "보통",
            "hint": "내일은 오늘보다 3°C 더 추워요. 오늘보다 한 단계 두꺼운 아우터를 준비해보세요."
        }
    }
    return render_template("coordination.html", data=data, active="coordination")

@app.route("/closet")
def closet():
    data = {
        "insight": "지난 30일 동안, 상의는 주로 니트류를, 바지는 슬랙스를 많이 입었어요.",
        "favorites": [
            {
                "date": "2025.01.15",
                "summary": "체감온도 8°C · 맑음",
                "img": "https://placehold.co/73x73"
            },
            {
                "date": "2025.01.12",
                "summary": "체감온도 12°C · 흐림",
                "img": "https://placehold.co/73x73"
            }
        ],
        "stats": {
            "top1": {"name": "크림 롱코트", "category": "아우터", "count": 8, "img": "https://placehold.co/40x40"},
            "top2": {"name": "베이지 니트", "category": "상의", "count": 6, "img": "https://placehold.co/36x36"},
            "tip": "이번 달 가장 자주 입은 아우터는 ‘크림 롱코트’예요. 8번 착용했습니다."
        },
        "unworn60": [
            {"name": "블랙 조끼", "meta": "아우터 · 2024.10.15", "img": "https://placehold.co/40x40"},
            {"name": "블랙 부츠", "meta": "신발 · 착용 기록 없음", "img": "https://placehold.co/40x40"},
            {"name": "레드 운동화", "meta": "신발 · 착용 기록 없음", "img": "https://placehold.co/40x40"},
        ],
        "cleanup": [
            {"name": "화이트 셔츠", "meta": "상의 · 2024.06.20", "img": "https://placehold.co/48x48", "pick": "discard"},
            {"name": "그레이 카디건", "meta": "상의 · 2024.06.20", "img": "https://placehold.co/48x48", "pick": "donate"},
            {"name": "레드 운동화", "meta": "신발 · 착용 기록 없음", "img": "https://placehold.co/48x48", "pick": "discard"},
        ]
    }
    return render_template("closet.html", data=data)

@app.route("/mypage")
def mypage():
    data = {
        "user": {
            "name": "이예원",
            "avatar": "https://placehold.co/48x48",
            "temp_tag": "#추위 민감",
            "styles": ["#포멀", "#러블리"],
            "avoid": ["#민소매", "#반바지", "#탑"],
        },
        "avoid_manage": ["민소매", "반바지", "탑"],
        "sliders": {
            "casual_formal": 70,
            "simple_lovely": 55,
        },
        "health": [
            {"label": "비염", "checked": False},
            {"label": "햇빛 알레르기", "checked": True},
            {"label": "아토피/피부 민감", "checked": False},
            {"label": "기압 변화에 따른 두통", "checked": False},
        ],
        "aids": [
            {"label": "마스크", "checked": False},
            {"label": "양산", "checked": True},
            {"label": "모자", "checked": True},
            {"label": "레인부츠", "checked": False},
            {"label": "우비", "checked": True},
        ],
        "notify": [
            {"label": '아침에 "오늘의 아이템" 알림', "checked": True},
            {"label": "미세먼지 나쁜 날 마스크 알림", "checked": True},
            {"label": "자외선 강한 날 양산/모자 알림", "checked": False},
        ],
    }
    return render_template("mypage.html", data=data)


if __name__ == "__main__":
    app.run(debug=True)
