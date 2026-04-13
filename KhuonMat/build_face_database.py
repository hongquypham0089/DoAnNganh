"""
build_face_database.py
Tạo embedding database từ dataset khuôn mặt (Lưu Đa Mẫu - Multi-Template)

Input:
- Thư mục chứa ảnh gốc của từng người (VD: tập test)
- Model backbone (.pth)

Output:
- File face_database.npz chứa embeddings (Lưu nguyên bản mọi góc mặt) + labels
"""

import os
import argparse
from pathlib import Path

import torch
import numpy as np
from PIL import Image
from tqdm import tqdm
from facenet_pytorch import MTCNN

# import model của bạn
from models.mobilefacenet import MobileFaceNet

# ----------------------------
# Load model
# ----------------------------
def load_model(model_path, device):
    model = MobileFaceNet(embedding_size=512)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    return model

# ----------------------------
# Build database
# ----------------------------
def build_database(data_dir, model, mtcnn, device):
    data_dir = Path(data_dir)
    
    embeddings_list = []
    labels_list = []
    
    label_dirs = sorted([d for d in data_dir.iterdir() if d.is_dir()])
    print(f"Tìm thấy {len(label_dirs)} người trong thư mục dữ liệu.")

    for label_dir in label_dirs:
        name = label_dir.name
        image_paths = list(label_dir.glob("*.*"))
        
        person_embeddings = []
        
        print(f"Đang xử lý '{name}'...")
        for img_path in tqdm(image_paths, leave=False):
            try:
                # Mở ảnh bằng PIL
                img = Image.open(img_path).convert("RGB")
                
                # MTCNN tự động tìm mặt, cắt, căn chỉnh và resize về 224x224
                # keep_all=False nên nó chỉ lấy 1 khuôn mặt to/rõ nhất trong ảnh
                face_tensor = mtcnn(img)
                
                if face_tensor is not None:
                    # Đưa vào device (unsqueeze để tạo batch size = 1)
                    face_tensor = face_tensor.unsqueeze(0).to(device)

                    # Trích xuất embedding
                    with torch.no_grad():
                        emb = model(face_tensor)  # (1,512)
                        emb = emb.cpu().numpy().flatten()
                        
                        # BƯỚC QUAN TRỌNG: Chuẩn hóa vector (L2 normalization)
                        emb = emb / np.linalg.norm(emb)
                        
                        person_embeddings.append(emb)
                else:
                    pass # Không tìm thấy mặt
                    
            except Exception as e:
                print(f"Lỗi khi đọc ảnh {img_path}: {e}")

        # LƯU ĐA MẪU (MULTI-TEMPLATE): Giữ nguyên mọi góc mặt
        if len(person_embeddings) > 0:
            for emb in person_embeddings:
                embeddings_list.append(emb)
                labels_list.append(name)
            print(f"-> Đã lưu {len(person_embeddings)} khuôn mặt/góc độ cho '{name}'.\n")
        else:
            print(f"-> CẢNH BÁO: Không tìm thấy khuôn mặt hợp lệ nào cho '{name}'.\n")

    embeddings = np.array(embeddings_list)
    labels = np.array(labels_list)

    print(f"Hoàn thành! Database hiện chứa tổng cộng {len(embeddings)} templates.")
    return embeddings, labels

# ----------------------------
# Save database
# ----------------------------
def save_database(embeddings, labels, save_path):
    np.savez_compressed(
        save_path,
        embeddings=embeddings,
        labels=labels
    )
    print(f"Đã lưu Database tại: {save_path}")

# ----------------------------
# MAIN
# ----------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=str, required=True,
                        help='Thư mục chứa ảnh (Mỗi sub-folder là 1 người, VD: aligned-data/test)')
    parser.add_argument('--model-path', type=str, required=True,
                        help='Đường dẫn tới file backbone.pth')
    parser.add_argument('--output', type=str, default='face_database.npz')

    args = parser.parse_args()

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print("Đang sử dụng thiết bị:", device)

    # Khởi tạo MTCNN
    mtcnn = MTCNN(image_size=224, margin=0, keep_all=False, device=device)

    # Load model
    model = load_model(args.model_path, device)

    # Build database
    embeddings, labels = build_database(args.data_dir, model, mtcnn, device)

    # Save
    save_database(embeddings, labels, args.output)

if __name__ == "__main__":
    main()