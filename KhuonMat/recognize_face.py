"""
recognize_face.py
Nhận diện khuôn mặt realtime bằng cosine similarity + threshold
Sử dụng MTCNN thay cho Haar Cascade để đảm bảo độ chính xác.
"""

import cv2
import torch
import numpy as np
from PIL import Image
from facenet_pytorch import MTCNN

from models.mobilefacenet import MobileFaceNet

# ----------------------------
# CONFIG
# ----------------------------
MODEL_PATH = "output/best_backbone.pth"  # Sửa lại đường dẫn nếu cần
DB_PATH = "face_database.npz"
THRESHOLD = 0.65   # 🔥 Bạn có thể tinh chỉnh: 0.60 -> 0.70

# ----------------------------
# Load model & MTCNN
# ----------------------------
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Đang chạy trên thiết bị: {device}")

# Khởi tạo MTCNN (keep_all=True để nhận diện nhiều người cùng lúc trong khung hình)
mtcnn = MTCNN(image_size=224, margin=20, keep_all=True, device=device)

# Khởi tạo MobileFaceNet
model = MobileFaceNet(embedding_size=512)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

# ----------------------------
# Load database
# ----------------------------
data = np.load(DB_PATH)
db_embeddings = data["embeddings"]   # (N,512)
db_labels = data["labels"]           # (N,)

print(f"Đã tải Database: {db_embeddings.shape[0]} khuôn mặt mẫu.")

# ----------------------------
# Cosine similarity
# ----------------------------
def cosine_similarity(a, b):
    # Do đã chuẩn hóa L2, nên tính np.dot là đủ, nhưng giữ nguyên công thức chuẩn cho an toàn
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# ----------------------------
# Hàm nhận diện 1 khuôn mặt
# ----------------------------
def recognize_face(embedding):
    best_score = -1
    best_name = "Unknown"

    for db_emb, label in zip(db_embeddings, db_labels):
        score = cosine_similarity(embedding, db_emb)
        if score > best_score:
            best_score = score
            best_name = str(label)

    # So sánh với ngưỡng (THRESHOLD)
    if best_score < THRESHOLD:
        return "Unknown", best_score

    return best_name, best_score

# ----------------------------
# Webcam Realtime
# ----------------------------
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Lỗi: Không thể mở Camera.")
    exit()

print("Đang bật Camera... Bấm phím 'ESC' để thoát.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Chuyển đổi BGR sang RGB cho PIL
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img_pil = Image.fromarray(frame_rgb)

    # MTCNN phát hiện khung mặt (boxes)
    boxes, probs = mtcnn.detect(img_pil)

    if boxes is not None:
        # MTCNN cắt và căn chỉnh các khuôn mặt thành tensor (N, 3, 224, 224)
        faces = mtcnn.extract(img_pil, boxes, save_path=None)
        
        if faces is not None:
            for i, face_tensor in enumerate(faces):
                # Lấy tọa độ bounding box để vẽ lên màn hình
                x1, y1, x2, y2 = [int(b) for b in boxes[i]]
                
                # Trích xuất embedding của khuôn mặt
                face_tensor = face_tensor.unsqueeze(0).to(device)
                with torch.no_grad():
                    emb = model(face_tensor).cpu().numpy().flatten()
                    emb = emb / np.linalg.norm(emb) # Chuẩn hóa L2

                # Nhận diện
                name, score = recognize_face(emb)

                # Vẽ khung và text lên màn hình
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                
                # Ràng buộc tọa độ tránh lỗi ngoài màn hình
                x1, y1 = max(0, x1), max(0, y1)
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    frame,
                    f"{name} ({score:.2f})",
                    (x1, max(20, y1 - 10)), # Không để text bị tràn lên trên
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2
                )

    # Hiển thị
    cv2.imshow("He thong Nhan dien Khuon mat", frame)

    if cv2.waitKey(1) & 0xFF == 27:  # Bấm ESC để thoát
        break

cap.release()
cv2.destroyAllWindows()