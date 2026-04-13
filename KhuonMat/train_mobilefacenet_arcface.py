import os
import json
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from PIL import Image
from tqdm import tqdm

from models.mobilefacenet import MobileFaceNet, ArcMarginProduct


# =========================
# Dataset
# =========================
class FaceDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform

        self.image_paths = []
        self.labels = []
        self.label_to_idx = {}

        self._load_dataset()

    def _load_dataset(self):
        persons = sorted([d for d in self.root_dir.iterdir() if d.is_dir()])

        for idx, person in enumerate(persons):
            self.label_to_idx[person.name] = idx

            for img_path in person.glob("*"):
                if img_path.suffix.lower() in [".jpg", ".png", ".jpeg"]:
                    self.image_paths.append(img_path)
                    self.labels.append(idx)

        print("Total images:", len(self.image_paths))
        print("Total classes:", len(self.label_to_idx))

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        return image, label


# =========================
# Model
# =========================
class FaceModel(nn.Module):
    def __init__(self, num_classes, embedding_size=512):
        super().__init__()
        self.backbone = MobileFaceNet(embedding_size)
        self.arcface = ArcMarginProduct(embedding_size, num_classes)

    def forward(self, x, labels=None):
        embeddings = self.backbone(x)
        if labels is not None:
            logits = self.arcface(embeddings, labels)
            return logits
        return embeddings


# =========================
# Train
# =========================
def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_dir = "aligned-data/train"
    test_dir = "aligned-data/test"
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    checkpoint_path = os.path.join(output_dir, "checkpoint.pth")
    backbone_path = os.path.join(output_dir, "backbone.pth")
    best_model_path = os.path.join(output_dir, "best_backbone.pth")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.5,0.5,0.5],[0.5,0.5,0.5])
    ])

    train_dataset = FaceDataset(train_dir, transform)
    test_dataset = FaceDataset(test_dir, transform)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

    num_classes = len(train_dataset.label_to_idx)

    model = FaceModel(num_classes).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    start_epoch = 0
    best_acc = 0
    epochs = 30

    # =========================
    # Resume training nếu có checkpoint
    # =========================
    if os.path.exists(checkpoint_path):
        print("Loading checkpoint...")
        checkpoint = torch.load(checkpoint_path, map_location=device)

        model.load_state_dict(checkpoint["model_state_dict"])
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        start_epoch = checkpoint["epoch"] + 1
        best_acc = checkpoint["best_acc"]

        print(f"Resume training from epoch {start_epoch}")

    # =========================
    # Training loop
    # =========================
    for epoch in range(start_epoch, epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0

        pbar = tqdm(train_loader)

        for images, labels in pbar:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images, labels)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            total_loss += loss.item()

            _, preds = outputs.max(1)
            correct += preds.eq(labels).sum().item()
            total += labels.size(0)

            acc = 100. * correct / total
            pbar.set_description(f"Epoch {epoch+1} Loss {loss:.4f} Acc {acc:.2f}%")

        # =========================
        # Test
        # =========================
        model.eval()
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels in test_loader:
                images = images.to(device)
                labels = labels.to(device)

                outputs = model(images, labels)
                _, preds = outputs.max(1)

                correct += preds.eq(labels).sum().item()
                total += labels.size(0)

        test_acc = 100. * correct / total
        print("Test Acc:", test_acc)

        # =========================
        # Save backbone (dùng cho recognition)
        # =========================
        torch.save(model.backbone.state_dict(), backbone_path)

        # =========================
        # Save best model
        # =========================
        if test_acc > best_acc:
            best_acc = test_acc
            torch.save(model.backbone.state_dict(), best_model_path)
            print("Saved Best Model!")

        # =========================
        # Save checkpoint
        # =========================
        torch.save({
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "best_acc": best_acc
        }, checkpoint_path)

        # Save label map
        with open(f"{output_dir}/label_map.json", "w") as f:
            json.dump(train_dataset.label_to_idx, f)

    print("Training done")


if __name__ == "__main__":
    train()