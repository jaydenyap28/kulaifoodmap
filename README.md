# Kulai Food Map (古来美食地图) 🍜

一个专注于马来西亚古来（Kulai）地区的美食探索平台。帮助用户发现本地美食、随机决定“今天吃什么”，并提供商家信息查询。

## 功能特点 ✨

- **美食探索**：浏览古来地区的各类美食商家。
- **今天吃什么**：随机抽取美食，解决选择困难症。
- **商家筛选**：支持按营业状态（营业中/休息中）和美食类别筛选。
- **用户互动**：
  - 推荐喜爱的商家。
  - 为商家评分和撰写评论。
  - 支持“请我喝杯 Kopi”打赏功能（Touch 'n Go QR）。
- **管理员模式**：
  - 商家信息的增删改查。
  - 管理恶意评论。
  - 更新打赏 QR Code。

## 技术栈 🛠️

- **前端框架**: React + Vite
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **动画**: Framer Motion

## 本地运行 🚀

1. 克隆项目：
   ```bash
   git clone https://github.com/jaydenyap28/kulaifoodmap.git
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 构建生产版本：
   ```bash
   npm run build
   ```

## 部署

本项目适配 Vercel 零配置部署。

1. 在 Vercel 控制台导入此 GitHub 仓库。
2. 保持默认构建设置（Framework Preset: Vite）。
3. 点击 Deploy 即可。
