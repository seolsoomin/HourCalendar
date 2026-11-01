import { useCallback, useState } from 'react';
import { OVERLAP_CODE } from '../api/client';

export default function useInvitationResponder() {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [overlap, setOverlap] = useState(null);

  const respond = useCallback(async (fn, scheduleId, allowOverlap = false) => {
    setBusyId(scheduleId);
    setError(null);
    setOverlap(null);
    try {
      await fn(scheduleId, allowOverlap);
    } catch (err) {
      if (err.code === OVERLAP_CODE) {
        setOverlap({ scheduleId, message: err.message });
      } else {
        setError({ scheduleId, message: err.message });
      }
    } finally {
      setBusyId(null);
    }
  }, []);

  return { busyId, error, overlap, respond };
}
