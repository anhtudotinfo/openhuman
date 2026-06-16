import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { callCoreRpc } from '../../../services/coreRpcClient';
import { openhumanMigrateHermes } from '../core';

vi.mock('../../../services/coreRpcClient', () => ({ callCoreRpc: vi.fn() }));

vi.mock('../common', () => ({ isTauri: vi.fn(() => true), CommandResponse: undefined }));

describe('openhumanMigrateHermes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('dispatches openhuman.migrate_hermes and returns the response', async () => {
    const expected = { result: { migrated: 0, skipped: 0 }, messages: [] };
    vi.mocked(callCoreRpc).mockResolvedValueOnce(expected as never);

    const got = await openhumanMigrateHermes();

    expect(callCoreRpc).toHaveBeenCalledWith({
      method: 'openhuman.migrate_hermes',
      params: { source_workspace: undefined, dry_run: true },
    });
    expect(got).toEqual(expected);
  });

  it('still dispatches via callCoreRpc when not running inside the Tauri shell', async () => {
    const { isTauri } = await import('../common');
    vi.mocked(isTauri).mockReturnValueOnce(false);
    const expected = { result: { migrated: 0, skipped: 0 }, messages: [] };
    vi.mocked(callCoreRpc).mockResolvedValueOnce(expected as never);

    const got = await openhumanMigrateHermes();

    expect(callCoreRpc).toHaveBeenCalledWith({
      method: 'openhuman.migrate_hermes',
      params: { source_workspace: undefined, dry_run: true },
    });
    expect(got).toEqual(expected);
  });
});
