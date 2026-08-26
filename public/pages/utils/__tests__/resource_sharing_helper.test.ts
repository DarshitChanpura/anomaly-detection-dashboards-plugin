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
  getApplication: jest.fn(),
  getDataSourceEnabled: jest.fn(() => ({ enabled: false })),
}));

jest.mock('../../../../opensearch_dashboards.json', () => ({
  supportedOSDataSourceVersions: '>=2.9.0',
  unsupportedOSDataSourceEngineTypes: ['AnalyticEngine'],
  requiredOSDataSourcePlugins: ['opensearch-anomaly-detection'],
}));

import { isResourceSharingAvailable } from '../helpers';
import { getApplication } from '../../../services';

const mockGetApplication = getApplication as jest.Mock;

const withResourceSharing = (resourceSharing?: Record<string, unknown>) =>
  mockGetApplication.mockReturnValue({
    capabilities: resourceSharing ? { resourceSharing } : {},
  });

describe('isResourceSharingAvailable', () => {
  afterEach(() => mockGetApplication.mockReset());

  it('returns false when the resourceSharing capability is absent', () => {
    withResourceSharing();
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('returns false when resource sharing is disabled', () => {
    withResourceSharing({ enabled: false, availableTypes: 'anomaly-detector' });
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('returns false when the resource type is not in availableTypes', () => {
    withResourceSharing({
      enabled: true,
      availableTypes: 'workflow,forecaster',
    });
    expect(isResourceSharingAvailable('anomaly-detector')).toBe(false);
  });

  it('defaults to the anomaly-detector type and returns true when it is present', () => {
    withResourceSharing({
      enabled: true,
      availableTypes: 'workflow,anomaly-detector',
    });
    expect(isResourceSharingAvailable()).toBe(true);
  });

  it('respects an explicit resource type argument', () => {
    withResourceSharing({ enabled: true, availableTypes: 'forecaster' });
    expect(isResourceSharingAvailable('forecaster')).toBe(true);
    expect(isResourceSharingAvailable('anomaly-detector')).toBe(false);
  });

  it('returns false and swallows errors when getApplication throws', () => {
    mockGetApplication.mockImplementation(() => {
      throw new Error('application not ready');
    });
    expect(isResourceSharingAvailable()).toBe(false);
  });
});
