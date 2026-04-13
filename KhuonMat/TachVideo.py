import cv2
import os
import math
from tkinter import Tk, filedialog

# Ẩn cửa sổ chính của Tkinter
root = Tk()
root.withdraw()

# Chọn file video
video_path = filedialog.askopenfilename(
    title="Chọn video",
    filetypes=[("Video files", "*.mp4 *.avi *.mov *.mkv")]
)

if not video_path:
    print("Bạn chưa chọn video.")
    exit()

# Chọn thư mục lưu ảnh
output_folder = filedialog.askdirectory(title="Chọn thư mục chính để lưu ảnh")

if not output_folder:
    print("Bạn chưa chọn thư mục lưu.")
    exit()

# Tạo 2 thư mục con 'train' và 'val'
train_folder = os.path.join(output_folder, "train")
val_folder = os.path.join(output_folder, "val")
os.makedirs(train_folder, exist_ok=True)
os.makedirs(val_folder, exist_ok=True)

cap = cv2.VideoCapture(video_path)

# Lấy các thông số của video
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Xác định khoảng cách giữa các frame (Hiện tại đang chia 5)
frame_interval = int(fps / 5) 
if frame_interval <= 0:
    frame_interval = 1

# Tính toán tổng số ảnh dự kiến trích xuất và mốc cắt 80%
expected_saved_count = math.ceil(total_frames / frame_interval)
train_limit = int(expected_saved_count * 0.8)

frame_count = 0
saved_count = 0
train_count = 0
val_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    if frame_count % frame_interval == 0:
        saved_count += 1
        
        # Đặt tên ảnh theo số tăng dần (00001.jpg, 00002.jpg...)
        image_name = f"{saved_count:05d}.jpg"
        
        # 80% ảnh đầu vào thư mục train, 20% còn lại vào val
        if saved_count <= train_limit:
            filename = os.path.join(train_folder, image_name)
            train_count += 1
        else:
            filename = os.path.join(val_folder, image_name)
            val_count += 1
            
        cv2.imwrite(filename, frame)

    frame_count += 1

cap.release()

print("--- HOÀN THÀNH ---")
print(f"Tổng số ảnh trích xuất: {saved_count}")
print(f" - Đã lưu vào {train_folder}: {train_count} ảnh (đầu video)")
print(f" - Đã lưu vào {val_folder}: {val_count} ảnh (cuối video)")