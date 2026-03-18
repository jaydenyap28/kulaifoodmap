/**
 * 为外链追加 UTM 参数，便于 GA4/平台后台归因
 * 如果原链接无效则原样返回，避免影响主流程
 */
export const appendUtm = (rawUrl, params = {}) => {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  } catch {
    return rawUrl;
  }
};
