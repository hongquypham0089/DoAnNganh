"""
evaluate_model.py
Đánh giá độ chính xác của hệ thống nhận diện khuôn mặt
"""

import os
import argparse
from pathlib import Path

import torch
import numpy as np
from PIL import Image
from tqdm import tqdm
from facenet_pytorch import MTCNN
from sklearn.metrics import classification_report, accuracy_score

from models.mobilefacenet import MobileFaceNet

# ----------------------------
# Các hàm phụ trợ
# ----------------------------
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def recognize_face(embedding, db_embeddings, db_labels, threshold):
    best_score = -1
    best_name = "Unknown"

    for db_emb, label in zip(db_embeddings, db_labels):
        score = cosine_similarity(embedding, db_emb)
        if score > best_score:
            best_score = score
            best_name = str(label)

    if best_score < threshold:
        return "Unknown", best_score

    return best_name, best_score

# ----------------------------
# MAIN
# ----------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test-dir', type=str, required=True,
                        help='Thư mục chứa ảnh test (cấu trúc mỗi folder là 1 người)')
    parser.add_argument('--model-path', type=str, default='output/best_backbone.pth')
    parser.add_argument('--db-path', type=str, default='face_database.npz')
    parser.add_argument('--threshold', type=float, default=0.65, help='Ngưỡng nhận diện')
    args = parser.parse_args()

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"--- ĐANG ĐÁNH GIÁ MÔ HÌNH TRÊN THIẾT BỊ: {device.upper()} ---")
    print(f"Ngưỡng Threshold: {args.threshold}")

    # 1. Load MTCNN & Model
    mtcnn = MTCNN(image_size=224, margin=20, keep_all=False, device=device)
    model = MobileFaceNet(embedding_size=512)
    model.load_state_dict(torch.load(args.model_path, map_location=device))
    model = model.to(device)
    model.eval()

    # 2. Load Database
    if not os.path.exists(args.db_path):
        print("Lỗi: Không tìm thấy Database. Hãy chạy build_face_database.py trước.")
        return
        
    data = np.load(args.db_path)
    db_embeddings = data["embeddings"]
    db_labels = data["labels"]
    print(f"Đã tải Database ({len(db_embeddings)} mẫu).")

    # 3. Quá trình đánh giá
    test_dir = Path(args.test_dir)
    y_true = []
    y_pred = []

    label_dirs = sorted([d for d in test_dir.iterdir() if d.is_dir()])
    
    for label_dir in label_dirs:
        true_name = label_dir.name
        image_paths = list(label_dir.glob("*.*"))
        
        for img_path in tqdm(image_paths, desc=f"Đang test '{true_name}'", leave=False):
            try:
                img = Image.open(img_path).convert("RGB")
                face_tensor = mtcnn(img)
                
                if face_tensor is not None:
                    face_tensor = face_tensor.unsqueeze(0).to(device)
                    with torch.no_grad():
                        emb = model(face_tensor).cpu().numpy().flatten()
                        emb = emb / np.linalg.norm(emb)
                    
                    pred_name, _ = recognize_face(emb, db_embeddings, db_labels, args.threshold)
                    
                    y_true.append(true_name)
                    y_pred.append(pred_name)
                else:
                    # Nếu MTCNN không thấy mặt, coi như nhận diện sai (Unknown)
                    y_true.append(true_name)
                    y_pred.append("Unknown")
                    
            except Exception as e:
                pass

    # 4. In báo cáo kết quả
    print("\n" + "="*50)
    print("BÁO CÁO KẾT QUẢ ĐÁNH GIÁ (CLASSIFICATION REPORT)")
    print("="*50)
    
    acc = accuracy_score(y_true, y_pred)
    print(f"-> Độ chính xác tổng thể (Accuracy): {acc * 100:.2f}%\n")
    
    # In chi tiết từng người dùng scikit-learn
    print(classification_report(y_true, y_pred, zero_division=0))

if __name__ == "__main__":
    main()