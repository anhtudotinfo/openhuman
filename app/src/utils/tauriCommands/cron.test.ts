/**
 * Vitest coverage for the two new cron tauriCommand wrappers added by the
 * skills runner PR: openhumanCronRun and openhumanCronRuns.
 *
 * Follows the same mocking pattern as subconscious.test.ts — isTauri()
 * guard + callCoreRpc mock, no real Tauri runtime.
 */
import { isTauri } from '@tauri-apps/api/core';
import { afterEach, beforeEach, describe, expect, type Mock, test, vi } from 'vitest';

import { callCoreRpc } from '../../services/coreRpcClient';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn() }));
vi.mock('../../services/coreRpcClient', () => ({ callCoreRpc: vi.fn() }));

describe('tauriCommands/cron — openhumanCronRun / openhumanCronRuns', () => {
  const mockIsTauri = isTauri as Mock;
  const mockCallCoreRpc = callCoreRpc as Mock;
  let openhumanCronAdd: typeof import('./cron').openhumanCronAdd;
  let openhumanCronRun: typeof import('./cron').openhumanCronRun;
  let openhumanCronRuns: typeof import('./cron').openhumanCronRuns;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
    const m = await vi.importActual<typeof import('./cron')>('./cron');
    openhumanCronAdd = m.openhumanCronAdd;
    openhumanCronRun = m.openhumanCronRun;
    openhumanCronRuns = m.openhumanCronRuns;
  });

  afterEach(() => vi.restoreAllMocks());

  describe('openhumanCronAdd', () => {
    const params = { schedule: { kind: 'cron' as const, expr: '*/5 * * * *' }, name: 'test' };

    test('still forwards to core RPC over HTTP when not in Tauri (webapp build)', async () => {
      mockIsTauri.mockReturnValue(false);
      mockCallCoreRpc.mockResolvedValue({ id: 'job-1' });
      const result = await openhumanCronAdd(params);
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'openhuman.cron_add' })
      );
      expect(result).toEqual({ id: 'job-1' });
    });

    test('calls cron_add with params', async () => {
      mockCallCoreRpc.mockResolvedValue({ id: 'job-1' });
      await openhumanCronAdd(params);
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'openhuman.cron_add' })
      );
    });
  });

  describe('openhumanCronRun', () => {
    test('still forwards to core RPC over HTTP when not in Tauri (webapp build)', async () => {
      mockIsTauri.mockReturnValue(false);
      const response = {
        job_id: 'job-1',
        status: 'ok',
        duration_ms: 100,
        output: '',
      };
      mockCallCoreRpc.mockResolvedValue(response);
      const result = await openhumanCronRun('job-1');
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'openhuman.cron_run', params: { job_id: 'job-1' } })
      );
      expect(result).toEqual(response);
    });

    test('calls cron_run with job_id', async () => {
      mockCallCoreRpc.mockResolvedValue({
        job_id: 'job-1',
        status: 'ok',
        duration_ms: 100,
        output: '',
      });
      await openhumanCronRun('job-1');
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'openhuman.cron_run', params: { job_id: 'job-1' } })
      );
    });
  });

  describe('openhumanCronRuns', () => {
    test('still forwards to core RPC over HTTP when not in Tauri (webapp build)', async () => {
      mockIsTauri.mockReturnValue(false);
      mockCallCoreRpc.mockResolvedValue({ runs: [] });
      const result = await openhumanCronRuns('job-1');
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'openhuman.cron_runs',
          params: expect.objectContaining({ job_id: 'job-1', limit: 20 }),
        })
      );
      expect(result).toEqual({ runs: [] });
    });

    test('calls cron_runs with job_id and default limit', async () => {
      mockCallCoreRpc.mockResolvedValue({ runs: [] });
      await openhumanCronRuns('job-1');
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'openhuman.cron_runs',
          params: expect.objectContaining({ job_id: 'job-1', limit: 20 }),
        })
      );
    });

    test('passes custom limit', async () => {
      mockCallCoreRpc.mockResolvedValue({ runs: [] });
      await openhumanCronRuns('job-1', 5);
      expect(mockCallCoreRpc).toHaveBeenCalledWith(
        expect.objectContaining({ params: expect.objectContaining({ limit: 5 }) })
      );
    });
  });
});
