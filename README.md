# 神奇生物图鉴 · 新华动物园奇异兽类展区

一本正经胡说八道的恶搞物种图鉴：把随手拍的橘子和一幅手绘涂鸦，包装成动物园的正式展板。
顶部导航栏在三个展板之间切换。

| 展板 | 页面 | 内容 |
|---|---|---|
| 李氏鸭狼 | `index.html` | 生活在天津海河流域、最早由李氏发现的鸭狼；互动按钮播放 5 帧、0.9 秒的「跳起来咬人」 |
| 尼尔多龙（蛋） | `nieldoron.html` | 听力不太好的尼尔多龙、九崒山、日本匠人爆米花·远，以及那枚刻了字的龙蛋；页尾可与龙蛋对话 |
| 非官方物种 | `unofficial.html` | 民间投稿：左上角可进「管理员」或「投稿」，带图片上传、删帖与投稿开关 |

## 尼尔多龙（蛋）· 与龙蛋对话

在页面最后的输入框里写一句 20 字以内的话（例如「你好龙蛋」），龙蛋会把对话框弹出 5 秒。
它听力不好：只保留第一个字和后面随机一个字，中间的部分一律换成省略号，末尾补一个问号，
所以「你好龙蛋」通常会被听成「你…龙？」。实现见 `nieldoron.js` 里的 `garble()`。

## 非官方物种 · 投稿系统

前端是纯静态页，后端是 **Cloudflare Pages `_worker.js` + D1**（不是 Workers：
`*.workers.dev` 在中国大陆被墙，`*.pages.dev` 可以正常访问）。

- 接口地址：`https://zoo-api.pages.dev`
- 角色：**管理员**（可删帖、开关投稿）与 **投稿**（只能提交）
- 密码保存在 Cloudflare 项目的加密环境变量里（`ADMIN_PASS` / `SUBMIT_PASS`），前端拿不到，
  校验在服务端完成；登录后拿到一个 HMAC 签名、6 小时的 token
- 投稿字段：物种名称、提供人、物种介绍、图片（可选，浏览器端压到长边 1200px / ≤1.3 MB）
- 图片直接存进 D1（单行上限 2 MB），因此不需要 R2；免费额度 500 MB 数据库
- 限流：同一 IP 每小时最多 8 条投稿；仅接受 `https://le333444.github.io` 与本地调试来源的跨域写请求

| 接口 | 说明 |
|---|---|
| `GET /api/posts` | 列表 + 投稿是否开放 |
| `GET /api/img/:id` | 图片 |
| `POST /api/login` | `{role, password}` → 签名 token |
| `POST /api/posts` | 提交（需 token） |
| `DELETE /api/posts/:id` | 删帖（管理员） |
| `POST /api/state` | `{open:true/false}` 投稿开关（管理员） |

## 站点结构

```
index.html                     李氏鸭狼展板
nieldoron.html                 尼尔多龙（蛋）展板
unofficial.html                非官方物种（民间投稿）
styles.css                     博物馆展板风格样式（含顶部导航、弹窗与投稿卡片）
app.js                         鸭狼：5 帧动画播放 + 计数 + 装饰性“二维码”
nieldoron.js                   龙蛋：对话乱码逻辑 + 5 秒气泡
unofficial.js                  非官方物种：登录、投稿、压缩图片、删帖、开关
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

纯属虚构、仅供娱乐。鸭狼、尼尔多龙、九崒山、爆米花·远、「权威」二字、全部档案数据与
「非官方物种」里的投稿均为杜撰或民间想象；鸭狼图片是一幅手绘涂鸦，所谓龙蛋其实是一枚被刻了字的橘子。
请勿据此引用或申报课题。
