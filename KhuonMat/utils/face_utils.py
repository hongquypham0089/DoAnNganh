"""
Tiện ích xử lý khuôn mặt
"""

import cv2
import torch
import numpy as np
from pathlib import Path
import pickle

class FaceDetector:
    """Phát hiện khuôn mặt"""
    
    def __init__(self, device='cpu'):
        self.device = device
        
        if device == 'cuda':
            self.net = cv2.dnn.readNetFromCaffe(
                'models/deploy.prototxt',
                'models/res10_300x300_ssd_iter_140000.caffemodel'
            )
        else:
            # Sử dụng Haar Cascade cho CPU
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
    
    def detect_faces(self, image):
        """Phát hiện khuôn mặt trong ảnh"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        results = []
        for (x, y, w, h) in faces:
            results.append({
                'box': (x, y, w, h),
                'confidence': 1.0,
                'landmarks': None
            })
        
        return results
    
    def extract_face(self, image, face_info, target_size=(112, 112)):
        """Trích xuất và căn chỉnh khuôn mặt"""
        x, y, w, h = face_info['box']
        
        # Đảm bảo không ra ngoài ảnh
        x = max(0, x)
        y = max(0, y)
        w = min(w, image.shape[1] - x)
        h = min(h, image.shape[0] - y)
        
        face = image[y:y+h, x:x+w]
        
        if face.size == 0:
            return None
        
        # Resize về kích thước chuẩn
        face = cv2.resize(face, target_size)
        
        return face

class FaceRecognizer:
    """Nhận diện khuôn mặt"""
    
    def __init__(self, model_path, device='cpu'):
        self.device = torch.device(device)
        self.load_model(model_path)
        self.face_detector = FaceDetector(device)
    
    def load_model(self, model_path):
        """Tải mô hình MobileFaceNet"""
        from models.mobilefacenet import MobileFaceNet
        
        self.model = MobileFaceNet(embedding_size=512)
        self.model.to(self.device).eval()
        
        checkpoint = torch.load(model_path, map_location=self.device)
        state_dict = checkpoint.get('model_state_dict', checkpoint)
        
        # Clean state dict
        clean_dict = {}
        for k, v in state_dict.items():
            if k.startswith('module.'):
                clean_dict[k[7:]] = v
            elif k.startswith('backbone.'):
                clean_dict[k[9:]] = v
            else:
                clean_dict[k] = v
        
        self.model.load_state_dict(clean_dict, strict=False)
    
    def extract_embedding(self, face_img):
        """Trích xuất embedding từ khuôn mặt"""
        # Chuyển đổi ảnh
        face = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        face = cv2.resize(face, (112, 112))
        face = (face.astype(np.float32) / 255.0 - 0.5) / 0.5
        
        # Chuyển sang tensor
        tensor = torch.from_numpy(face.transpose(2, 0, 1))
        tensor = tensor.unsqueeze(0).to(self.device)
        
        # Extract embedding
        with torch.no_grad():
            emb = self.model(tensor).cpu().numpy().flatten()
        
        # Chuẩn hóa
        emb = emb / (np.linalg.norm(emb) + 1e-10)
        
        return emb
    
    def recognize_face(self, embedding, database, threshold=1.1):
        """Nhận diện khuôn mặt từ embedding"""
        if len(database['embeddings']) == 0:
            return "Unknown", 0.0, -1
        
        embeddings_array = np.array(database['embeddings'])
        names_array = database['names']
        
        # Tính khoảng cách
        distances = np.linalg.norm(embeddings_array - embedding, axis=1)
        min_idx = np.argmin(distances)
        min_dist = distances[min_idx]
        
        # Tính confidence (càng gần 1 càng tốt)
        confidence = max(0.0, 1.0 - min_dist)
        
        if min_dist < threshold:
            return names_array[min_idx], confidence, min_idx
        else:
            return "Unknown", confidence, -1
    
    def process_frame(self, frame, database):
        """Xử lý frame camera"""
        # Phát hiện khuôn mặt
        faces = self.face_detector.detect_faces(frame)
        
        for face in faces:
            if face['confidence'] < 0.9:
                continue
            
            x, y, w, h = face['box']
            if w < 50 or h < 50:
                continue
            
            # Trích xuất khuôn mặt
            aligned = self.face_detector.extract_face(frame, face, (112, 112))
            if aligned is None:
                continue
            
            # Extract embedding
            emb = self.extract_embedding(aligned)
            
            # Nhận diện
            name, conf, idx = self.recognize_face(emb, database)
            
            # Vẽ bounding box
            color = (0, 255, 0) if name != "Unknown" else (0, 165, 255)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            
            # Hiển thị tên và confidence
            label = f"{name} ({conf:.2f})"
            cv2.putText(frame, label, (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        return frame
    
    def recognize_single_face(self, image, database):
        """Nhận diện một khuôn mặt duy nhất trong ảnh"""
        faces = self.face_detector.detect_faces(image)
        
        if len(faces) == 0:
            return None
        
        # Lấy khuôn mặt có confidence cao nhất
        best_face = max(faces, key=lambda x: x['confidence'])
        aligned = self.face_detector.extract_face(image, best_face, (112, 112))
        
        if aligned is None:
            return None
        
        # Extract embedding và nhận diện
        emb = self.extract_embedding(aligned)
        name, conf, idx = self.recognize_face(emb, database)
        
        return name, conf, emb