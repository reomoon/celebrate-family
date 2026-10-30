"""영상편지 — 영상을 올리고 다시 볼 수 있는 작은 웹 앱.

환경 변수 (같은 폴더의 .env 파일에 적어 두어도 된다)
  ADMIN_PASSWORD  CAMERA(업로드/삭제)에 들어갈 비밀번호. 없으면 실행할 때마다 임시 비밀번호를 만든다.
  HOST            접속을 받을 주소 (기본 0.0.0.0 = 같은 Wi-Fi의 휴대폰도 접속 가능,
                  nginx 뒤에서 돌릴 때는 127.0.0.1)
  PORT            서버 포트 (기본 5000)
"""

import functools
import hmac
import json
import math
import os
import secrets
import socket
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory, session

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = BASE_DIR / "uploads"
THUMB_DIR = UPLOAD_DIR / "thumbs"
DB_PATH = BASE_DIR / "videos.json"
SECRET_KEY_PATH = BASE_DIR / ".secret_key"
ENV_PATH = BASE_DIR / ".env"

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v", ".ogv"}
MAX_UPLOAD_BYTES = 2 * 1024**3  # 2GB


def load_env_file(path):
    # KEY=VALUE 형식. 이미 설정된 환경 변수가 있으면 그쪽이 우선이다.
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        key, sep, value = line.partition("=")
        key = key.strip()
        if sep and key and not key.startswith("#"):
            os.environ.setdefault(key, value.strip())


load_env_file(ENV_PATH)
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

UPLOAD_DIR.mkdir(exist_ok=True)
THUMB_DIR.mkdir(exist_ok=True)


def load_secret_key():
    # 로그인 쿠키 서명용 키. 파일로 남겨 두어 서버를 다시 켜도 로그인이 유지된다.
    if not SECRET_KEY_PATH.exists():
        SECRET_KEY_PATH.write_text(secrets.token_hex(32), encoding="utf-8")
    return SECRET_KEY_PATH.read_text(encoding="utf-8").strip()


app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")
app.config.update(
    MAX_CONTENT_LENGTH=MAX_UPLOAD_BYTES,
    SECRET_KEY=load_secret_key(),
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
)

db_lock = threading.Lock()


def load_videos():
    if not DB_PATH.exists():
        return []
    return json.loads(DB_PATH.read_text(encoding="utf-8"))


def save_videos(videos):
    tmp_path = DB_PATH.with_suffix(".json.tmp")
    tmp_path.write_text(json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(DB_PATH)


def parse_duration(value):
    try:
        duration = float(value)
    except (TypeError, ValueError):
        return 0
    return round(duration, 2) if math.isfinite(duration) and duration > 0 else 0


def admin_token():
    # 비밀번호가 바뀌면 토큰도 바뀌어서, 예전에 로그인한 기기는 자동으로 로그아웃된다.
    return hmac.new(app.secret_key.encode(), ADMIN_PASSWORD.encode(), "sha256").hexdigest()


def is_admin():
    return bool(ADMIN_PASSWORD) and hmac.compare_digest(session.get("admin", ""), admin_token())


def admin_required(view):
    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        if not is_admin():
            return jsonify(error="비밀번호를 다시 입력해 주세요."), 401
        return view(*args, **kwargs)

    return wrapper


@app.get("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.get("/api/session")
def get_session():
    return jsonify(admin=is_admin())


@app.post("/api/login")
def login():
    password = str((request.get_json(silent=True) or {}).get("password", ""))
    if not ADMIN_PASSWORD or not hmac.compare_digest(password.encode(), ADMIN_PASSWORD.encode()):
        time.sleep(1)  # 비밀번호를 마구 대입해 보는 시도를 느리게
        return jsonify(error="비밀번호가 맞지 않아요."), 401
    session.permanent = True
    session["admin"] = admin_token()
    return "", 204


@app.post("/api/logout")
def logout():
    session.clear()
    return "", 204


@app.get("/api/videos")
def list_videos():
    with db_lock:
        videos = load_videos()
    return jsonify(sorted(videos, key=lambda v: v["created_at"], reverse=True))


@app.post("/api/videos")
@admin_required
def upload_video():
    file = request.files.get("video")
    if not file or not file.filename:
        return jsonify(error="영상 파일이 없어요."), 400

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify(error="MP4, WebM, MOV 형식의 영상만 올릴 수 있어요."), 400

    video_id = uuid.uuid4().hex
    filename = video_id + ext
    file_path = UPLOAD_DIR / filename
    file.save(file_path)

    # 썸네일은 브라우저가 영상에서 한 장면을 캡처해 함께 보내준다.
    thumbnail = request.files.get("thumbnail")
    thumbnail_name = None
    if thumbnail and thumbnail.mimetype == "image/jpeg":
        thumbnail_name = video_id + ".jpg"
        thumbnail.save(THUMB_DIR / thumbnail_name)

    title = (request.form.get("title") or "").strip() or Path(file.filename).stem
    video = {
        "id": video_id,
        "title": title[:100],
        "message": (request.form.get("message") or "").strip()[:2000],
        "filename": filename,
        "thumbnail": thumbnail_name,
        "original_name": file.filename,
        "size": file_path.stat().st_size,
        "duration": parse_duration(request.form.get("duration")),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with db_lock:
        videos = load_videos()
        videos.append(video)
        save_videos(videos)

    return jsonify(video), 201


@app.delete("/api/videos/<video_id>")
@admin_required
def delete_video(video_id):
    with db_lock:
        videos = load_videos()
        video = next((v for v in videos if v["id"] == video_id), None)
        if video is None:
            abort(404)
        videos.remove(video)
        save_videos(videos)

    (UPLOAD_DIR / video["filename"]).unlink(missing_ok=True)
    if video["thumbnail"]:
        (THUMB_DIR / video["thumbnail"]).unlink(missing_ok=True)
    return "", 204


@app.get("/media/<path:filename>")
def media(filename):
    # conditional=True 로 Range 요청을 지원해서 영상 탐색(seek)이 가능하다.
    return send_from_directory(UPLOAD_DIR, filename, conditional=True)


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(error="파일이 너무 커요. 2GB 이하의 영상만 올릴 수 있어요."), 413


def lan_address():
    """같은 Wi-Fi의 휴대폰에서 접속할 이 컴퓨터의 내부 IP."""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        try:
            sock.connect(("8.8.8.8", 80))  # 경로만 정할 뿐 실제로 패킷을 보내지는 않는다
            return sock.getsockname()[0]
        except OSError:
            return None


if __name__ == "__main__":
    from waitress import serve

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    if not ADMIN_PASSWORD:
        ADMIN_PASSWORD = secrets.token_urlsafe(6)
        print(f"\n  ADMIN_PASSWORD is not set. Temporary password: {ADMIN_PASSWORD}")

    print(f"\n  PC:     http://127.0.0.1:{port}")
    lan_ip = lan_address() if host == "0.0.0.0" else None
    if lan_ip:
        print(f"  Phone:  http://{lan_ip}:{port}  (same Wi-Fi)\n")

    # waitress 기본 요청 크기 한도(1GB)를 업로드 한도에 맞춰 늘린다.
    serve(app, host=host, port=port, threads=8, max_request_body_size=MAX_UPLOAD_BYTES + 10 * 1024**2)
