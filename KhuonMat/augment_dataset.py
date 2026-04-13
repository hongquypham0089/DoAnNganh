import os
import cv2
import random
import numpy as np
from pathlib import Path
from tqdm import tqdm
import albumentations as A

def get_augmentation_pipeline():
    """
    Định nghĩa các phép biến đổi theo yêu cầu:
    - Lật ngang ngẫu nhiên
    - Xoay nhẹ
    - Độ sáng & Độ tương phản
    - Phóng to/Thu nhỏ (ShiftScaleRotate)
    """
    return A.Compose([
        A.HorizontalFlip(p=0.5), # Lật ngang 50%
        A.ShiftScaleRotate(
            shift_limit=0.05, 
            scale_limit=0.1,   # Phóng to/thu nhỏ 20%
            rotate_limit=10,   # Xoay tối đa 15 độ
            p=0.8,
            bborder_mode=cv2.BORDER_REFLECT_101
        ),
        A.RandomBrightnessContrast(
            brightness_limit=0.2, 
            contrast_limit=0.2, 
            p=0.7
        ),
        A.GaussNoise(var_limit=(10.0, 50.0), p=0.3), # Thêm nhiễu nhẹ để model bền vững hơn
    ])

def augment_data(input_dir, num_aug=5):
    """
    input_dir: Đường dẫn đến folder 'aligned-data'
    num_aug: Số lượng ảnh tăng cường tạo ra từ 1 ảnh gốc
    """
    base_path = Path(input_dir)
    aug_pipeline = get_augmentation_pipeline()
    
    # Tìm tất cả các thư mục con của người dùng
    person_dirs = [d for d in base_path.iterdir() if d.is_dir()]
    
    print(f"🚀 Bắt đầu tăng cường dữ liệu trong: {input_dir}")
    
    for person_dir in person_dirs:
        # CHỈ TĂNG CƯỜNG TRÊN TẬP TRAIN
        train_dir = person_dir / "train"
        if not train_dir.exists():
            continue
            
        print(f"--- Đang xử lý: {person_dir.name} (train) ---")
        
        # Lấy danh sách ảnh đã được aligned (có đuôi _aligned.jpg)
        image_files = [p for p in train_dir.glob("*_aligned.jpg") if "_aug_" not in p.name]
        
        for img_path in tqdm(image_files, desc=f"Augmenting {person_dir.name}"):
            image = cv2.imread(str(img_path))
            if image is None:
                continue
            
            # Tạo ra num_aug ảnh biến đổi
            for i in range(num_aug):
                augmented = aug_pipeline(image=image)
                aug_img = augmented['image']

                # Resize về 224x224
                aug_img = cv2.resize(aug_img, (224, 224))

                # Lưu ảnh với hậu tố _aug_X
                out_name = f"{img_path.stem}_aug_{i}.jpg"
                out_path = train_dir / out_name
                cv2.imwrite(str(out_path), aug_img)

                augmented = aug_pipeline(image=image)
                aug_img = augmented['image']
                
                # Lưu ảnh với hậu tố _aug_X
                out_name = f"{img_path.stem}_aug_{i}.jpg"
                out_path = train_dir / out_name
                cv2.imwrite(str(out_path), aug_img)

if __name__ == "__main__":
    # Đường dẫn đến thư mục kết quả của bước trước
    ALIGNED_DATA_DIR = "aligned-data"
    
    if os.path.exists(ALIGNED_DATA_DIR):
        # Mỗi ảnh gốc sẽ tạo thêm 5 ảnh biến thể
        augment_data(ALIGNED_DATA_DIR, num_aug=5)
        print("\n✅ Hoàn thành tăng cường dữ liệu!")
        print("Lưu ý: Chỉ tập 'train' được tăng cường, tập 'val' giữ nguyên.")
    else:
        print(f"❌ Không tìm thấy thư mục: {ALIGNED_DATA_DIR}")