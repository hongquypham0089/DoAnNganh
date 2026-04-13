import base64
import io
import numpy as np
import cv2
import pyodbc
import torch
from PIL import Image
from facenet_pytorch import MTCNN
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# Import model của bạn
from models.mobilefacenet import MobileFaceNet

app = Flask(__name__)
CORS(app)  # Cho phép Node.js (cổng 3000) gọi sang Python (cổng 5000)

# ========================================================
# 1. CẤU HÌNH DATABASE SQL SERVER
# ========================================================
DB_CONFIG = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=QuanLyNhanSu;"
    "UID=sa;"
    "PWD=12345678;" # 🔥 THAY MẬT KHẨU CỦA BẠN VÀO ĐÂY
    "TrustServerCertificate=yes;"
)

# ========================================================
# 2. KHỞI TẠO & LOAD MODEL AI (CHỈ CHẠY 1 LẦN LÚC BẬT SERVER)
# ========================================================
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
MODEL_PATH = "output/best_backbone.pth"  
DB_PATH = "face_database.npz"
THRESHOLD = 0.7  # Ngưỡng nhận diện (0.7 là khá chặt chẽ)

print(f"[*] Đang khởi động Server AI trên {DEVICE}...")

# Load MTCNN (Cắt khuôn mặt)
mtcnn = MTCNN(image_size=224, margin=0, keep_all=False, device=DEVICE)

# Load MobileFaceNet (Trích xuất đặc trưng)
model = MobileFaceNet(embedding_size=512)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.to(DEVICE)
model.eval()

# Load Database Khuôn mặt (.npz)
try:
    data = np.load(DB_PATH)
    db_embeddings = data['embeddings']
    db_labels = data['labels']
    print(f"[*] Đã tải thành công {len(db_labels)} khuôn mặt từ {DB_PATH}!")
except Exception as e:
    print(f"[!] Lỗi tải database face_database.npz: {e}")
    db_embeddings, db_labels = [], []

# ========================================================
# 3. HÀM XỬ LÝ NHẬN DIỆN
# ========================================================
def recognize_face(image_base64, ma_nv_from_web):
    try:
        # Giải mã ảnh Base64 thành PIL Image
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # 1. MTCNN: Cắt mặt
        face_tensor = mtcnn(image)
        if face_tensor is None:
            return False, "Không tìm thấy khuôn mặt nào trước Camera!"
        
        # 2. MobileFaceNet: Tính vector đặc trưng
        face_tensor = face_tensor.unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            emb = model(face_tensor).cpu().numpy().flatten()
            emb = emb / np.linalg.norm(emb) # Chuẩn hóa L2
            
        # 3. So sánh Cosine Similarity
        if len(db_embeddings) == 0:
            return False, "Database khuôn mặt đang trống!"

        similarities = np.dot(db_embeddings, emb) / (
            np.linalg.norm(db_embeddings, axis=1) * np.linalg.norm(emb)
        )
        
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]
        closest_name = str(db_labels[best_idx]) # closest_name chính là MaNV trong npz
        
        # 4. Kiểm tra điều kiện ngặt nghèo
        if best_score < THRESHOLD:
            return False, f"Khuôn mặt giống {closest_name} ({best_score:.2f}) nhưng điểm chưa đạt ngưỡng an toàn ({THRESHOLD})."
            
        if closest_name != str(ma_nv_from_web):
            return False, f"Cảnh báo: Người chấm công ({closest_name}) không khớp với tài khoản đăng nhập ({ma_nv_from_web})!"

        return True, f"Nhận diện thành công ({best_score:.2f})"
        
    except Exception as e:
        print(f"Lỗi AI: {e}")
        return False, "Lỗi khi xử lý hình ảnh trên Server AI."

# ========================================================
# 4. API ENDPOINT (GIAO TIẾP VỚI NODE.JS)
# ========================================================
@app.route('/api/checkin', methods=['POST'])
def checkin():
    data = request.json
    ma_nv = data.get('MaNV')
    image_base64 = data.get('image')

    if not ma_nv or not image_base64:
        return jsonify({"success": False, "message": "Thiếu mã nhân viên hoặc ảnh!"}), 400

    # Chạy AI nhận diện
    is_match, msg = recognize_face(image_base64, ma_nv)

    if is_match:
        try:
            # LƯU VÀO DATABASE SQL SERVER
            conn = pyodbc.connect(DB_CONFIG)
            cursor = conn.cursor()
            
            now = datetime.now()
            ngay_cc = now.strftime('%Y-%m-%d')
            gio_hien_tai = now.strftime('%H:%M:%S')
            
            # 1. Kiểm tra xem hôm nay nhân viên đã chấm công lần nào chưa
            cursor.execute("SELECT GioCheckIn, GioCheckOut FROM ChamCong WHERE MaNV = ? AND NgayCC = ?", (ma_nv, ngay_cc))
            row = cursor.fetchone()

            if row:
                gio_in = row[0]
                gio_out = row[1]

                # Nếu đã có dữ liệu hôm nay
                if gio_out is not None:
                    # Đã có cả giờ ra -> Hôm nay đã chấm công xong
                    conn.close()
                    return jsonify({
                        "success": False, 
                        "message": "Bạn đã hoàn thành chấm công (Check-in & Check-out) cho hôm nay rồi!"
                    })
                else:
                    # Có giờ vào nhưng CHƯA có giờ ra -> Thực hiện CHECK-OUT VÀ TÍNH TỔNG GIỜ LÀM
                    time_in_str = str(gio_in)[:8] # Cắt lấy đúng 8 ký tự (HH:MM:SS) để tránh lỗi
                    time_in = datetime.strptime(time_in_str, '%H:%M:%S')
                    time_out = datetime.strptime(gio_hien_tai, '%H:%M:%S')
                    
                    # Tính toán tổng giờ (dạng số thập phân)
                    delta = time_out - time_in
                    tong_gio = round(delta.total_seconds() / 3600, 2)
                    if tong_gio < 0: 
                        tong_gio = 0

                    cursor.execute("""
                        UPDATE ChamCong 
                        SET GioCheckOut = ?, TongGioLam = ?
                        WHERE MaNV = ? AND NgayCC = ?
                    """, (gio_hien_tai, tong_gio, ma_nv, ngay_cc))
                    
                    conn.commit()
                    conn.close()

                    return jsonify({
                        "success": True, 
                        "trang_thai": "Check-out",
                        "message": f"Check-out thành công lúc {gio_hien_tai}. Tổng giờ làm: {tong_gio}h."
                    })

            else:
                # 2. Chưa có dữ liệu hôm nay -> Thực hiện CHECK-IN
                # Logic tính đi trễ (Sau 08:00:00 là trễ)
                trang_thai = "Đúng giờ" if now.hour < 8 or (now.hour == 8 and now.minute == 0) else "Đi trễ"

                cursor.execute("""
                    INSERT INTO ChamCong (MaNV, NgayCC, GioCheckIn, TrangThai, XacThucFaceID)
                    VALUES (?, ?, ?, ?, 1)
                """, (ma_nv, ngay_cc, gio_hien_tai, trang_thai))
                
                conn.commit()
                conn.close()

                return jsonify({
                    "success": True, 
                    "trang_thai": trang_thai,
                    "message": f"Khuôn mặt khớp! Check-in thành công lúc {gio_hien_tai}."
                })

        except Exception as e:
            print("Lỗi Database:", str(e))
            return jsonify({"success": False, "message": "Lỗi kết nối cơ sở dữ liệu!"})
    else:
        # Nếu AI trả về False (Không nhận ra, sai người, điểm thấp...)
        return jsonify({"success": False, "message": msg}), 401

if __name__ == '__main__':
    print("🚀 Server AI đang chạy tại http://localhost:5000")
    app.run(port=5000, debug=True)