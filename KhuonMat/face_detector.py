"""
face_detector.py
MTCNN face detector using facenet-pytorch
"""

import cv2
import numpy as np
from PIL import Image
import torch
from facenet_pytorch import MTCNN
from typing import List, Tuple, Optional, Dict, Any


class MTCNNFaceDetector:
    """
    Face detector + alignment using facenet-pytorch MTCNN
    """

    def __init__(self,
                 device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
                 min_face_size: int = 20,
                 thresholds=[0.6, 0.7, 0.7],
                 factor: float = 0.709):

        self.device = device

        # facenet-pytorch MTCNN
        self.detector = MTCNN(
            image_size=224,
            margin=20,
            min_face_size=min_face_size,
            thresholds=thresholds,
            factor=factor,
            post_process=False,
            keep_all=True,
            device=device
        )

    # ============================================================
    # 1) Detect face wrapper (convert output → old format)
    # ============================================================
    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect faces and convert result to the format:
        { 'box': [x,y,w,h], 'confidence': float, 'keypoints': {...} }
        """

        if image is None:
            return []

        # Convert BGR → RGB
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # facenet-pytorch output:
        # boxes: Nx4
        # probs: Nx1
        # landmarks: Nx5x2
        boxes, probs, landmarks = self.detector.detect(img_rgb, landmarks=True)

        if boxes is None:
            return []

        faces = []
        for box, prob, lmk in zip(boxes, probs, landmarks):
            if prob is None:
                continue

            x1, y1, x2, y2 = box.astype(int)
            w = x2 - x1
            h = y2 - y1

            face_info = {
                "box": [x1, y1, w, h],
                "confidence": float(prob),
                "keypoints": {
                    "left_eye": lmk[0].tolist(),
                    "right_eye": lmk[1].tolist(),
                    "nose": lmk[2].tolist(),
                    "mouth_left": lmk[3].tolist(),
                    "mouth_right": lmk[4].tolist(),
                }
            }

            faces.append(face_info)

        return faces

    # ============================================================
    # 2) Crop + align
    # ============================================================

    def extract_face(self, 
                        image: np.ndarray, 
                        face_info: Dict[str, Any], 
                        target_size=(224, 224)) -> Optional[np.ndarray]:
            try:
                # 1. MTCNN của facenet-pytorch cần ảnh PIL hoặc RGB
                img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                img_pil = Image.fromarray(img_rgb)
                
                x, y, w, h = face_info["box"]
                box = [x, y, x + w, y + h]

                face_tensor = self.detector.extract(img_pil, [box], save_path=None)

                if face_tensor is not None:
                    face_np = face_tensor[0].permute(1, 2, 0).numpy()
                    # BỎ PHÉP NHÂN 255 ĐI. Chỉ cần ép kiểu trực tiếp:
                    face_np = face_np.astype(np.uint8)
                    
                    # Chuyển hệ màu RGB sang BGR cho OpenCV xử lý
                    face_bgr = cv2.cvtColor(face_np, cv2.COLOR_RGB2BGR)
                    face_final = cv2.resize(face_bgr, target_size)
                    return face_final

                return None
            except Exception as e:
                print(f"Error extracting face: {e}")
                return None



    # ============================================================
    # 3) Align best face (Simplified for easy use)
    # ============================================================
    def align_face(self, image: np.ndarray, target_size=(224, 224)):
        faces = self.detect_faces(image)
        if not faces:
            return None

        best = max(faces, key=lambda x: x["confidence"])
        return self.extract_face(image, best, target_size)

    # ============================================================
    # 4) Draw detections
    # ============================================================
    def draw_detections(self, image: np.ndarray, faces):
        output = image.copy()

        for f in faces:
            x, y, w, h = f["box"]
            cv2.rectangle(output, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(output, f"{f['confidence']:.2f}", (x, y - 10),
                         cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

            for point in f["keypoints"].values():
                cv2.circle(output, (int(point[0]), int(point[1])), 2, (0, 0, 255), -1)

        return output


def create_face_detector(device='auto', **kwargs):
    if device == 'auto':
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
    return MTCNNFaceDetector(device=device, **kwargs)