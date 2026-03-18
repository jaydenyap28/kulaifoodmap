// 用法: node scripts/resolve-imgbb-link.mjs "https://ibb.co/xxxx"
// 输出: 尝试解析出的 i.ibb.co 直链

const input = process.argv[2];
if (!input) {
  console.error('请传入 ImgBB 页面链接，例如: node scripts/resolve-imgbb-link.mjs "https://ibb.co/xxxx"');
  process.exit(1);
}

try {
  const res = await fetch(input, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; KulaiFoodBot/1.0)',
    },
  });

  if (!res.ok) {
    console.error(`请求失败: ${res.status}`);
    process.exit(1);
  }

  const html = await res.text();

  // 优先抓 og:image
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (og?.[1]) {
    console.log(og[1]);
    process.exit(0);
  }

  // 兜底抓 i.ibb.co 直链
  const direct = html.match(/https:\/\/i\.ibb\.co\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|avif|gif)/i);
  if (direct?.[0]) {
    console.log(direct[0]);
    process.exit(0);
  }

  console.error('未找到可用的 i.ibb.co 直链');
  process.exit(1);
} catch (err) {
  console.error('解析失败:', err.message);
  process.exit(1);
}
