# 神奇生物图鉴 · 新华动物园奇异兽类展区

一本正经胡说八道的恶搞物种图鉴：把随手拍的橘子和一幅手绘涂鸦，包装成动物园的正式展板。
顶部导航栏在两个展板之间切换。

| 展板 | 页面 | 内容 |
|---|---|---|
| 李氏鸭狼 | `index.html` | 生活在天津海河流域、最早由李氏发现的鸭狼；互动按钮播放 5 帧、0.9 秒的「跳起来咬人」 |
| 尼尔多龙（蛋） | `nieldoron.html` | 听力不太好的尼尔多龙、九崒山、日本匠人爆米花·远，以及那枚刻了字的龙蛋；页尾可与龙蛋对话 |

## 尼尔多龙（蛋）· 与龙蛋对话

在页面最后的输入框里写一句 20 字以内的话（例如「你好龙蛋」），龙蛋会把对话框弹出 5 秒。
它听力不好：只保留第一个字和后面随机一个字，中间的部分一律换成省略号，末尾补一个问号，
所以「你好龙蛋」通常会被听成「你…龙？」。实现见 `nieldoron.js` 里的 `garble()`。

## 站点结构

```
index.html                     李氏鸭狼展板
nieldoron.html                 尼尔多龙（蛋）展板
styles.css                     博物馆展板风格样式（含顶部导航与新展板样式）
app.js                         鸭狼：5 帧动画播放 + 计数 + 装饰性“二维码”
nieldoron.js                   龙蛋：对话乱码逻辑 + 5 秒气泡
assets/duck-wolf-source.jpg    鸭狼原始手绘照片
assets/frames/base.png         鸭狼静态姿势
assets/frames/frame-1..5.png   鸭狼 5 帧动画（每帧 180 ms，合计 0.9 s）
assets/nieldoron/egg-1..3.jpg  龙蛋（橘子）三视图
assets/nieldoron/baomihua.jpg  爆米花·远先生肖像
assets/nieldoron/egg-dialog.jpg 对话栏目的龙蛋立绘
tools/generate-frames.ps1      由原始照片生成鸭狼动画帧的脚本
```

## 重新生成鸭狼动画帧

`tools/generate-frames.ps1` 用 GDI+ 把照片里的铅笔线条抠成透明 PNG：
先用大半径均值模糊求局部底色，再用「底色 − 亮度」得到线条强度并转成 alpha，
最后按帧参数（缩放、旋转、位移、速度线）合成 900×800 的透明画布。

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File tools/generate-frames.ps1
```

## 关于仓库名

GitHub 的仓库名只允许 ASCII 字母、数字与 `. - _`，所以「神奇生物图鉴」在仓库名里写作
`shenqi-shengwu-tujian`，中文名放在仓库简介与页面上。

## 声明

纯属虚构、仅供娱乐。鸭狼、尼尔多龙、九崒山、爆米花·远、「权威」二字、两处互动装置与全部档案数据均为杜撰；
鸭狼图片是一幅手绘涂鸦，所谓龙蛋其实是一枚被刻了字的橘子。请勿据此引用或申报课题。
