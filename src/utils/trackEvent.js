import ReactGA from 'react-ga4';

const isProd = import.meta.env.PROD;

/**
 * 统一 GA4 事件上报入口，避免各组件重复判断环境
 * @param {string} action 事件动作名（推荐 snake_case）
 * @param {object} params 事件参数
 */
export const trackEvent = (action, params = {}) => {
  if (!isProd || !action) return;

  try {
    ReactGA.event(action, params);
  } catch (err) {
    // 埋点失败不影响主流程
    console.warn('[analytics] trackEvent failed:', err);
  }
};

/**
 * 页面浏览埋点
 */
export const trackPageView = (path, title) => {
  if (!isProd || !path) return;

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title,
    });
  } catch (err) {
    console.warn('[analytics] pageview failed:', err);
  }
};
