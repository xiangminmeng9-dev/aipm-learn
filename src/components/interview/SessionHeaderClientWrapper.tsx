'use client';

import { useState } from 'react';
import SessionHeader from '@/components/interview/SessionHeader';

export default function SessionHeaderClientWrapper({
  sessionId,
  jdText,
  resumeText,
}: {
  sessionId: string;
  jdText: string | null;
  resumeText: string | null;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (data: { jd_text?: string; resume_text?: string }) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/interview/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // 静默失败
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SessionHeader
      jdText={jdText}
      resumeText={resumeText}
      onUpdate={handleUpdate}
      isUpdating={isUpdating}
    />
  );
}
