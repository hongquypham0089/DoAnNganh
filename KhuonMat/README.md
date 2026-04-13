# 🎓 Hệ Thống Điểm Danh Bằng Khuôn Mặt

*(Face Recognition Attendance System)*

**Môn học:** Học sâu (INF1473)
**Tên đề tài:** Nhận diện khuôn mặt và xác thực danh tính

Hệ thống điểm danh bằng khuôn mặt được xây dựng dựa trên mô hình học sâu **MTCNN** để nhận diện khuôn mặt và **MobileFaceNet** kết hợp với hàm mất mát **ArcFace** để trích xuất vector đặc trưng khuôn mặt (face embedding).
Mô hình **MTCNN** được sử dụng cho bài toán phát hiện và căn chỉnh khuôn mặt.
Hệ thống hỗ trợ **điểm danh thời gian thực thông qua giao diện Web**.

---

## 🌟 Tính năng chính

* **Phát hiện khuôn mặt:**
  Sử dụng MTCNN để phát hiện và căn chỉnh khuôn mặt chính xác trước khi nhận diện.

* **Nhận diện khuôn mặt:**
  MobileFaceNet trích xuất vector đặc trưng 512 chiều cho mỗi khuôn mặt.

* **Điểm danh thời gian thực:**
  Truyền video từ trình duyệt về server thông qua SocketIO, xử lý nhận diện và phản hồi ngay lập tức.

* **Quản lý thời gian làm việc:**
  Tự động xác định đi muộn (Late) và về sớm (Early) dựa trên cấu hình hệ thống.

* **Giao diện Admin:**
  Xem danh sách điểm danh và xuất báo cáo dưới dạng file CSV.

---

## 🛠️ Công nghệ sử dụng

* **Ngôn ngữ:** Python 3.8+
* **Web Framework:** Flask, Flask-SocketIO
* **Deep Learning:** PyTorch, Torchvision
* **Xử lý ảnh:** OpenCV, Pillow, NumPy
* **Mô hình:** MobileFaceNet, MTCNN
* **Lưu trữ dữ liệu:**

  * `.pkl`: Cơ sở dữ liệu khuôn mặt
  * `.csv`: Lịch sử điểm danh

---

## 📂 Cấu trúc dự án

KhuonMat/
├── app.py                       # Flask Server chính + SocketIO (Web điểm danh)
├── config.py                    # Cấu hình hệ thống (ngưỡng, thời gian, đường dẫn)
├── requirements.txt             # Danh sách thư viện cần cài đặt
├── README.md                    # Tài liệu mô tả dự án
├── build_aligned_dataset.py     # Tiền xử lý & căn chỉnh khuôn mặt (112x112) bằng MTCNN
├── train_embedding_model.py     # Huấn luyện MobileFaceNet với ArcFace
├── create_face_database.py      # Tạo database embedding khuôn mặt (.pkl)
├── predict_single_image.py      # Nhận diện khuôn mặt từ ảnh đơn (test nhanh)
├── evaluate_performance.py      # Đánh giá mô hình (distance, similarity, metrics)
├── face_detector.py             # Lớp wrapper MTCNN phát hiện khuôn mặt
│
├── aligned-data/                # Dữ liệu khuôn mặt đã được căn chỉnh
│   └── errors.json              # Ghi nhận ảnh lỗi trong quá trình tiền xử lý
│
├── models/
│   └── mobilefacenet.py         # Định nghĩa kiến trúc MobileFaceNet
│
├── training_output/             # Kết quả huấn luyện mô hình
│   ├── backbone.pth             # Trọng số backbone
│   ├── best_checkpoint.pth      # Mô hình tốt nhất
│   ├── final_model.pth          # Mô hình cuối cùng
│   ├── history.pkl              # Lịch sử train (loss, accuracy)
│   ├── training_log.txt         # Log huấn luyện
│   ├── training_report.txt      # Báo cáo huấn luyện
│   ├── test_results.json        # Kết quả test
│   └── checkpoints/             # Checkpoint theo từng epoch
│
├── evaluation_results/          # Kết quả đánh giá mô hình
│   ├── embeddings.npy           # Vector embedding tập đánh giá
│   ├── labels.npy               # Nhãn tương ứng
│   ├── distance_matrix.npy      # Ma trận khoảng cách Euclidean
│   ├── similarity_matrix.npy    # Ma trận độ tương đồng
│   ├── metrics.json             # Các chỉ số đánh giá
│   └── evaluation_results.json  # Tổng hợp kết quả đánh giá
│
├── utils/
│   ├── face_utils.py            # Xử lý khuôn mặt & tính embedding
│   ├── csv_handler.py           # Ghi / đọc dữ liệu điểm danh CSV
│   └── json_utils.py            # Hỗ trợ xử lý file JSON
│
├── static/                      # Tài nguyên frontend
│   ├── css/                     # File CSS
│   ├── js/                      # JavaScript (camera, attendance, main)
│   └── uploads/                 # Ảnh frame tạm thời từ camera
│
└── templates/                   # Giao diện HTML
    ├── base.html                # Layout chung
    ├── user.html                # Giao diện điểm danh
    └── admin.html               # Giao diện quản trị


---

## 🚀 Hướng dẫn cài đặt và khởi chạy

### 1️⃣ Chuẩn bị môi trường

Cài đặt các thư viện cần thiết:

```bash
pip install flask flask-socketio torch torchvision opencv-python pandas facenet-pytorch tqdm
```
pip install -r requirements.txt
---

### 2️⃣ Chuẩn bị dữ liệu và Database

**Bước 1:**
Đặt ảnh khuôn mặt gốc vào thư mục `dataset/`
(Mỗi thư mục con tương ứng với một người)

**Bước 2: Căn chỉnh và chuẩn hóa ảnh về kích thước `112x112`:**

```bash
python build_aligned_dataset.py
```

**Bước 3: huấn luyện mô hình để học vector đặc trưng (embedding)**
```bash
python train_embedding_model.py --data-dir aligned_faces --output-dir training_output
```

**Bước 4: Tạo cơ sở dữ liệu khuôn mặt**
```bash
python create_face_database.py --aligned-dir aligned-data --model-path training_output/backbone.pth
```

**Bước 5: nhận diện khuôn mặt trên ảnh đơn bằng mô hình đã huấn luyện**
```bash
python predict_single_image.py
```
sử dụng các file ảnh trong thư mục "test" để kiểm thử ứng dụng
(ảnh obama và trump có thể sử dụng ảnh trên gg)
---

### 3️⃣ Khởi chạy ứng dụng Web (xác thực khuôn mặt realtime)

```bash
python app.py
```

* **Giao diện người dùng:** `http://localhost:5000/user`
* **Giao diện quản trị:** `http://localhost:5000/admin`

---

## ⚙️ Cấu hình quan trọng (`config.py`)

Hệ thống sử dụng **Khoảng cách Euclidean (L2 Distance)** để so khớp khuôn mặt:

* `RECOGNITION_THRESHOLD`
  Ngưỡng nhận diện (mặc định: `1.1`)

* `CHECK_IN_TIME`
  Giờ bắt đầu làm việc (ví dụ: `08:00`)

* `CHECK_OUT_TIME`
  Giờ kết thúc làm việc (ví dụ: `17:00`)

---

## 📝 Lưu ý

* Các file HTML **bắt buộc** nằm trong thư mục `templates/` để tránh lỗi `TemplateNotFound`.
* Trình duyệt cần cấp quyền truy cập **Camera**.
* Ảnh trong database nên được chụp trong điều kiện ánh sáng tương tự môi trường điểm danh thực tế để đạt độ chính xác cao.


---

**Tác giả:** *[Phạm Hồng Quý]*
**Năm thực hiện:** 2025