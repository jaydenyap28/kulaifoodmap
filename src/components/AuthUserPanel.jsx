import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Coins, Loader2, LogIn, LogOut } from 'lucide-react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';
import { buildFallbackProfile, claimDailyCheckin, syncProfileForUser } from '../services/profileService';
import { useToast } from './toast/ToastProvider';

const getTodayInKualaLumpur = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kuala_Lumpur',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const AuthUserPanel = () => {
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);
  const [isBusy, setIsBusy] = useState(false);

  const displayProfile = useMemo(() => {
    if (profile) {
      return profile;
    }

    if (session?.user) {
      return buildFallbackProfile(session.user);
    }

    return null;
  }, [profile, session]);

  const hasCheckedInToday = displayProfile?.last_checkin_date === getTodayInKualaLumpur();

  const hydrateSession = useCallback(async (nextSession) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextProfile = await syncProfileForUser(nextSession.user);
      setProfile(nextProfile);
    } catch (error) {
      console.error('Failed to sync Supabase profile', error);
      setProfile(buildFallbackProfile(nextSession.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;

    const safeHydrate = async (nextSession) => {
      if (!active) {
        return;
      }

      await hydrateSession(nextSession);
    };

    supabase.auth.getSession().then(({ data }) => {
      safeHydrate(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      safeHydrate(nextSession);
    });

    const handleProfileRefresh = async () => {
      const { data } = await supabase.auth.getSession();
      safeHydrate(data.session);
    };

    window.addEventListener('profile-refresh', handleProfileRefresh);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener('profile-refresh', handleProfileRefresh);
    };
  }, [hydrateSession]);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast.info('先配置 Supabase 环境变量，登录功能才会生效。');
      return;
    }

    setIsBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google login failed', error);
      toast.error(error.message || '登录暂时失败了，请稍后再试。');
      setIsBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) {
      return;
    }

    setIsBusy(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.info('已退出登录。');
    } catch (error) {
      console.error('Logout failed', error);
      toast.error(error.message || '退出登录失败，请稍后再试。');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDailyCheckin = async () => {
    if (!session?.user || hasCheckedInToday) {
      if (hasCheckedInToday) {
        toast.info('今天已经签到过啦，明天再来。');
      }
      return;
    }

    setIsBusy(true);

    try {
      const result = await claimDailyCheckin();

      setProfile((currentProfile) => ({
        ...(currentProfile || buildFallbackProfile(session.user)),
        user_points: result.user_points,
        consecutive_days: result.consecutive_days,
        last_checkin_date: result.last_checkin_date,
      }));
      window.dispatchEvent(new CustomEvent('spin-status-refresh'));
      window.dispatchEvent(new CustomEvent('profile-refresh'));

      toast.success(`签到成功，获得 ${result.awarded_points} 积分，已连续签到 ${result.consecutive_days} 天。`);
    } catch (error) {
      console.error('Daily check-in failed', error);

      if (error.message?.includes('ALREADY_CHECKED_IN_TODAY')) {
        toast.info('今天已经签到过啦，明天再来。');
      } else {
        toast.error(error.message || '签到失败了，请稍后再试。');
      }
    } finally {
      setIsBusy(false);
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-white/60"
        title="Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable login."
      >
        <span className="flex items-center gap-2">
          <LogIn size={16} />
          <span className="text-sm font-semibold">Google 登录</span>
        </span>
      </button>
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isBusy}
        className="rounded-full bg-white px-3 py-1.5 font-semibold text-black shadow-lg transition hover:bg-gray-200 disabled:opacity-70"
      >
        <span className="flex items-center gap-2">
          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          <span className="text-sm">Google 一键登录</span>
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 px-2 py-2 text-white shadow-lg backdrop-blur-md sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/15">
          {displayProfile?.avatar_url ? (
            <img
              src={displayProfile.avatar_url}
              alt={displayProfile.full_name || 'User avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold">
              {(displayProfile?.full_name || session.user.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 text-left">
          <p className="max-w-36 truncate text-sm font-semibold">
            {displayProfile?.full_name || session.user.email}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-amber-300" />
              {isLoading ? '同步中...' : `${displayProfile?.user_points ?? 0} 吃货积分`}
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck2 size={12} className="text-emerald-300" />
              连签 {displayProfile?.consecutive_days ?? 0} 天
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDailyCheckin}
          disabled={isBusy || isLoading || hasCheckedInToday}
          className={`rounded-full px-3 py-2 font-semibold transition disabled:cursor-not-allowed ${
            hasCheckedInToday
              ? 'bg-white/10 text-white/50'
              : 'bg-emerald-400 text-black hover:bg-emerald-300'
          } disabled:opacity-70`}
        >
          {isBusy ? '签到中...' : hasCheckedInToday ? '今日已签到' : '每日签到'}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isBusy}
          className="rounded-full p-2 transition hover:bg-white/10 disabled:opacity-70"
          title="Logout"
        >
          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
        </button>
      </div>
    </div>
  );
};

export default AuthUserPanel;
