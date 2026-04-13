"""
models/mobilefacenet.py
MobileFaceNet + ArcFace for Face Recognition
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math


# ============================================
# Bottleneck Block
# ============================================
class Bottleneck(nn.Module):
    def __init__(self, in_planes, out_planes, stride, expansion):
        super().__init__()
        self.connect = stride == 1 and in_planes == out_planes
        planes = expansion * in_planes

        self.conv1 = nn.Conv2d(in_planes, planes, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        self.prelu1 = nn.PReLU(planes)

        self.conv2 = nn.Conv2d(
            planes, planes, 3,
            stride=stride,
            padding=1,
            groups=planes,
            bias=False
        )
        self.bn2 = nn.BatchNorm2d(planes)
        self.prelu2 = nn.PReLU(planes)

        self.conv3 = nn.Conv2d(planes, out_planes, 1, bias=False)
        self.bn3 = nn.BatchNorm2d(out_planes)

    def forward(self, x):
        out = self.prelu1(self.bn1(self.conv1(x)))
        out = self.prelu2(self.bn2(self.conv2(out)))
        out = self.bn3(self.conv3(out))

        if self.connect:
            return x + out
        else:
            return out


# ============================================
# MobileFaceNet
# ============================================
class MobileFaceNet(nn.Module):
    def __init__(self, embedding_size=512):
        super().__init__()

        self.embedding_size = embedding_size

        self.cfg = [
            [2, 64, 5, 2],
            [4, 128, 1, 2],
            [2, 128, 6, 1],
            [4, 128, 1, 2],
            [2, 128, 2, 1]
        ]

        self.conv1 = nn.Conv2d(3, 64, 3, stride=2, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.prelu1 = nn.PReLU(64)

        self.layers = self._make_layers(64)

        self.conv2 = nn.Conv2d(128, 512, 1, bias=False)
        self.bn2 = nn.BatchNorm2d(512)
        self.prelu2 = nn.PReLU(512)

        # Depthwise conv
        self.conv3 = nn.Conv2d(
            512, embedding_size,
            kernel_size=7,
            groups=embedding_size,
            bias=False
        )
        self.bn3 = nn.BatchNorm2d(embedding_size)

        # 🔥 QUAN TRỌNG
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.flatten = nn.Flatten()

        self._initialize_weights()

    def _make_layers(self, in_planes):
        layers = []
        for expansion, out_planes, num_blocks, stride in self.cfg:
            strides = [stride] + [1] * (num_blocks - 1)
            for s in strides:
                layers.append(Bottleneck(in_planes, out_planes, s, expansion))
                in_planes = out_planes
        return nn.Sequential(*layers)

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        # Input expected normalized [-1, 1]
        x = self.prelu1(self.bn1(self.conv1(x)))
        x = self.layers(x)
        x = self.prelu2(self.bn2(self.conv2(x)))
        x = self.bn3(self.conv3(x))

        # 🔥 FIX embedding size
        x = self.pool(x)
        x = self.flatten(x)

        # Normalize embedding
        x = F.normalize(x)

        return x


# ============================================
# ArcFace Loss Layer
# ============================================
class ArcMarginProduct(nn.Module):
    def __init__(self, in_features, out_features, s=64.0, m=0.50):
        super().__init__()
        self.s = s
        self.m = m

        self.weight = nn.Parameter(torch.FloatTensor(out_features, in_features))
        nn.init.xavier_uniform_(self.weight)

        self.cos_m = math.cos(m)
        self.sin_m = math.sin(m)

    def forward(self, input, label):
        cosine = F.linear(F.normalize(input), F.normalize(self.weight))
        cosine = cosine.clamp(-1.0, 1.0)

        sine = torch.sqrt(1.0 - cosine ** 2)
        phi = cosine * self.cos_m - sine * self.sin_m

        one_hot = torch.zeros_like(cosine)
        one_hot.scatter_(1, label.view(-1, 1).long(), 1)

        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output *= self.s

        return output


# ============================================
# Test model
# ============================================
if __name__ == "__main__":
    model = MobileFaceNet(embedding_size=512)

    x = torch.randn(2, 3, 224, 224)
    x = (x - 127.5) / 128.0

    out = model(x)

    print("Input:", x.shape)
    print("Output:", out.shape)
    print("Norm:", out.norm(dim=1))
    print("Params:", sum(p.numel() for p in model.parameters()))