import { PrayerItem } from '../types';

export const DEFAULT_PRAYERS: PrayerItem[] = [
  {
    id: 'fajr',
    name: 'Fajr (Dawn)',
    time: '04:30',
    status: 'pending'
  },
  {
    id: 'dhuhr',
    name: 'Dhuhr (Noon)',
    time: '12:15',
    status: 'pending'
  },
  {
    id: 'asr',
    name: 'Asr (Afternoon)',
    time: '15:45',
    status: 'pending'
  },
  {
    id: 'maghrib',
    name: 'Maghrib (Sunset)',
    time: '18:30',
    status: 'pending'
  },
  {
    id: 'isha',
    name: 'Isha (Night)',
    time: '20:00',
    status: 'pending'
  }
];

export const PRAYER_REWARDS = {
  onTime: 50, // Praying within 30 minutes of Adhan
  late: 20, // Praying late but checked in
  streakBonus: 10, // Additional bonus for 5/5 daily streak
};
