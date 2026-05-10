'use client';

import { useState, useEffect } from 'react';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function LearningReminderBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('reminder_dismissed');
    if (stored === 'true') return;

    let timer: ReturnType<typeof setInterval>;

    async function check() {
      try {
        const res = await fetch('/api/settings/learning-reminder');
        if (!res.ok) return;
        const { reminder } = await res.json();
        if (!reminder || !reminder.enabled) return;

        const now = new Date();
        const today = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
        const dayIndex = today === 0 ? 7 : today; // Convert to 1=Mon...7=Sun

        if (!reminder.enabled_days.includes(dayIndex)) { setVisible(false); return; }

        const [h, m] = reminder.reminder_time.split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const targetMinutes = h * 60 + m;
        const diff = Math.abs(currentMinutes - targetMinutes);

        // Show if within 30 minutes of target time
        setVisible(diff <= 30);
      } catch {}
    }

    check();
    timer = setInterval(check, 5 * 60 * 1000); // recheck every 5 min

    return () => clearInterval(timer);
  }, [dismissed]);

  function handleDismiss() {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('reminder_dismissed', 'true');
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between bg-indigo-600 px-4 py-2.5 text-white">
      <div className="flex items-center gap-2 text-sm">
        <span>📚</span>
        <span>学习时间到！今天别忘了练习面试哦~</span>
      </div>
      <button
        onClick={handleDismiss}
        className="rounded px-2 py-0.5 text-xs text-indigo-200 hover:bg-indigo-500 transition-colors"
      >
        知道了
      </button>
    </div>
  );
}
