from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

@app.route("/")
def root():
    return redirect(url_for("mypage"))

@app.route("/mypage")
def mypage():
    return render_template("mypage.html", page_title="마이페이지")

@app.route("/coordination")
def coordination():
    return render_template("coordination.html", page_title="코디")

@app.route("/closet")
def closet():
    return render_template("closet.html", page_title="옷장")

if __name__ == "__main__":
    app.run(debug=True)