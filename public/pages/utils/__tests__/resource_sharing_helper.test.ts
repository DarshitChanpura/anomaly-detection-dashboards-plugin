/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

jest.mock('../../../services', () => ({
  getClient: jest.fn(),
  getDataSourceEnabled: jest.fn(() => ({ enabled: false })),
}));

jest.mock('../../../../opensearch_dashboards.json', () => ({
  supportedOSDataSourceVersions: '>=2.9.0',
  unsupportedOSDataSourceEngineTypes: ['AnalyticEngine'],
  requiredOSDataSourcePlugins: ['opensearch-anomaly-detection'],
}));

import { getResourceSharingAvailability } from '../helpers';
import { getClient } from '../../../services';

const mockGet = jest.fn();
(getClient as jest.Mock).mockReturnValue({ get: mockGet });

describe('getResourceSharingAvailability', () => {
  afterEach(() => {
    mockGet.mockReset();
    (getClient as jest.Mock).mockReturnValue({ get: mockGet });
  });

  it('returns true when the probe reports the type is available', async () => {
    mockGet.mockResolvedValue({ ok: true, available: true });
    await expect(
      getResourceSharingAvailability('anomaly-detector', 'ds-1')
    ).resolves.toBe(true);
  });

  it('returns false when the probe reports the type is not available', async () => {
    mockGet.mockResolvedValue({ ok: true, available: false });
    await expect(
      getResourceSharingAvailability('anomaly-detector', 'ds-1')
    ).resolves.toBe(false);
  });

  it('returns false (fail-closed) when the request throws', async () => {
    mockGet.mockRejectedValue(new Error('not found'));
    await expect(
      getResourceSharingAvailability('anomaly-detector', 'ds-1')
    ).resolves.toBe(false);
  });

  it('probes the availability route scoped to the data source when provided', async () => {
    mockGet.mockResolvedValue({ available: true });
    await getResourceSharingAvailability('forecaster', 'ds-9');
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/resource_sharing_availability/forecaster/ds-9')
    );
  });

  it('omits the data source id from the route when not provided', async () => {
    mockGet.mockResolvedValue({ available: true });
    await getResourceSharingAvailability('anomaly-detector');
    const calledUrl = mockGet.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/resource_sharing_availability/anomaly-detector');
    expect(calledUrl.endsWith('/anomaly-detector')).toBe(true);
  });
});
