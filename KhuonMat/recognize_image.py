import os
import cv2
import torch
import pickle
import numpy as np
from PIL import Image
from facenet_pytorch import MTCNN
import torch.nn.functional as F

from models.mobilefacenet import MobileFaceNet   # model của em

# ========================
# CONFIG
# ========================
IMAGE_PATH = "test1.jpg"
DATABASE_PATH = "face_database.npz"
MODEL_PATH = "output/backbone.pth"
THRESHOLD = 0.7
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# ========================
# LOAD MODEL
# ========================
model = MobileFaceNet(embedding_size=512).to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()

# ========================
# LOAD DATABASE
# ========================
data = np.load(DATABASE_PATH, allow_pickle=True)
db_embeddings = data["embeddings"]
db_labels = data["labels"]

print("Database loaded:", db_embeddings.shape)

# ========================
# MTCNN
# ========================
mtcnn = MTCNN(image_size=224, margin=20, device=DEVICE)

# ========================
# COSINE SIMILARITY
# ========================
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# ========================
# RECOGNIZE IMAGE
# ========================
img = Image.open(IMAGE_PATH).convert("RGB")

face = mtcnn(img)

if face is None:
    print("No face detected")
    exit()

face = face.unsqueeze(0).to(DEVICE)

with torch.no_grad():
    embedding = model(face)
    embedding = F.normalize(embedding).cpu().numpy()[0]

# ========================
# COMPARE DATABASE
# ========================
best_score = -1
best_label = "Unknown"

for db_emb, label in zip(db_embeddings, db_labels):
    score = cosine_similarity(embedding, db_emb)
    if score > best_score:
        best_score = score
        best_label = label

# Threshold
if best_score < THRESHOLD:
    best_label = "Unknown"

print("Result:", best_label)
print("Score:", best_score)