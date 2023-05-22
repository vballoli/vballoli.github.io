---
title: NFNets and Adaptive Gradient Clipping
summary: Implementation of the DeepMind paper in PyTorch with the models and a pytorch optimizer wrapper for AGC.
tags:
  - Deep Learning
date: '2021-02-07:00:00Z'

# Optional external URL for project (replaces project detail page).
external_link: 

image: 

links: 
url_code: 'https://github.com/vballoli/nfnets-pytorch'
url_pdf: ''
url_slides: ''
url_video: ''

slides: ""
---

# PyTorch implementation of Normalizer-Free Networks and Adaptive Gradient Clipping
![Python Package](https://github.com/vballoli/nfnets-pytorch/workflows/Upload%20Python%20Package/badge.svg)
![Docs](https://readthedocs.org/projects/nfnets-pytorch/badge/?version=latest)
[![Papers using ma-gym](https://img.shields.io/badge/-Papers%20using%20nfnets--pytorch-blue?style=flat&logo=googlescholar)](https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=nfnets-pytorch&btnG=)


Paper: https://arxiv.org/abs/2102.06171.pdf

Original code: https://github.com/deepmind/deepmind-research/tree/master/nfnets

Blog post: https://tourdeml.github.io/blog/posts/2021-03-31-adaptive-gradient-clipping/. Feel free to subscribe to the newsletter, and leave a comment if you have anything to add/suggest publicly.

Do star this repository if it helps your work, and [don't forget to cite](https://github.com/vballoli/nfnets-pytorch#cite-this-repository) if you use this code in your research!

# Installation

Install from PyPi:

`pip3 install nfnets-pytorch`

or install the latest code using:

`pip3 install git+https://github.com/vballoli/nfnets-pytorch`
# Usage
## WSConv2d

Use `WSConv1d, WSConv2d, ScaledStdConv2d(timm)` and `WSConvTranspose2d` like any other `torch.nn.Conv2d` or `torch.nn.ConvTranspose2d` modules.

```python
import torch
from torch import nn
from nfnets import WSConv2d, WSConvTranspose2d, ScaledStdConv2d

conv = nn.Conv2d(3,6,3)
w_conv = WSConv2d(3,6,3)

conv_t = nn.ConvTranspose2d(3,6,3)
w_conv_t = WSConvTranspose2d(3,6,3)
```

## Generic AGC (recommended)
```python
import torch
from torch import nn, optim
from torchvision.models import resnet18

from nfnets import WSConv2d
from nfnets.agc import AGC # Needs testing

conv = nn.Conv2d(3,6,3)
w_conv = WSConv2d(3,6,3)

optim = optim.SGD(conv.parameters(), 1e-3)
optim_agc = AGC(conv.parameters(), optim) # Needs testing

# Ignore fc of a model while applying AGC.
model = resnet18()
optim = torch.optim.SGD(model.parameters(), 1e-3)
optim = AGC(model.parameters(), optim, model=model, ignore_agc=['fc'])
```
## SGD - Adaptive Gradient Clipping

Similarly, use `SGD_AGC` like `torch.optim.SGD`
```python
# The generic AGC is preferable since the paper recommends not applying AGC to the last fc layer.
import torch
from torch import nn, optim
from nfnets import WSConv2d, SGD_AGC

conv = nn.Conv2d(3,6,3)
w_conv = WSConv2d(3,6,3)

optim = optim.SGD(conv.parameters(), 1e-3)
optim_agc = SGD_AGC(conv.parameters(), 1e-3)
```

## Using it within any non-residual PyTorch model (with non-residual connections)

`replace_conv` replaces the convolution in your (non-residual) model with the convolution class and replaces the batchnorm with identity. While the identity is not ideal, it shouldn't cause a major difference in the latency. 

> Note that as per the paper, replace_conv is only valid for non-residual models(vgg, mobilenetv1, etc.). See the above mentioned blog post for more information regarding the details.

```python
import torch
from torch import nn
from torchvision.models import vgg16

from nfnets import replace_conv, WSConv2d, ScaledStdConv2d

model = vgg16()
replace_conv(model, WSConv2d) # This repo's original implementation
replace_conv(model, ScaledStdConv2d) # From timm

"""
class YourCustomClass(nn.Conv2d):
  ...
replace_conv(model, YourCustomClass)
"""
```

# Docs

Find the docs at [readthedocs](https://nfnets-pytorch.readthedocs.io/en/latest/)

# Cite Original Work

To cite the original paper, use:
```
@article{brock2021high,
  author={Andrew Brock and Soham De and Samuel L. Smith and Karen Simonyan},
  title={High-Performance Large-Scale Image Recognition Without Normalization},
  journal={arXiv preprint arXiv:},
  year={2021}
}
```

# Cite this repository

To cite this repository, use:
```
@misc{nfnets2021pytorch,
  author = {Vaibhav Balloli},
  title = {A PyTorch implementation of NFNets and Adaptive Gradient Clipping},
  year = {2021},
  howpublished = {\url{https://github.com/vballoli/nfnets-pytorch}}
}
```