/** Design-only mock data for the user dashboard (no backend). */

export const MOCK_DASHBOARD_USER = {
  displayName: 'Alex Editor',
  email: 'alex@example.com',
  initials: 'AE',
} as const;

export const MOCK_STORAGE = {
  usedLabel: '4.2 GB',
  quotaLabel: '10 GB',
  percent: 42,
} as const;

export const MOCK_WEEKLY_EXPORTS = '3';

export type MockActivityKind = 'export' | 'project' | 'import';

export interface MockActivityItem {
  id: string;
  title: string;
  time: string;
  kind: MockActivityKind;
}

export const MOCK_ACTIVITY: MockActivityItem[] = [
  { id: '1', title: 'Exported “Summer reel” as MP4', time: '2 hours ago', kind: 'export' },
  { id: '2', title: 'Updated project “Brand intro”', time: 'Yesterday', kind: 'project' },
  { id: '3', title: 'Imported B-roll pack into “Docs”', time: '3 days ago', kind: 'import' },
  { id: '4', title: 'Exported audio as WAV', time: 'Last week', kind: 'export' },
];
