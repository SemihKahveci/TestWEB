import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { adminAPI } from '../services/api';

type StatusCounts = { completed: number; inProgress: number; expired: number; pending: number };
type ScoreDistributions = { customerFocus: number[]; uncertainty: number[]; ie: number[]; idik: number[] };
type TitleCounts = Record<string, number>;

const DEFAULT_TITLE_OPTIONS = [
  'Direktör',
  'Müdür/Yönetici',
  'Kıdemli Uzman',
  'Uzman',
  'Uzman Yardımcısı',
  'MT/Stajyer'
];

const initScoreDistributions = (): ScoreDistributions => ({
  customerFocus: new Array(10).fill(0),
  uncertainty: new Array(10).fill(0),
  ie: new Array(10).fill(0),
  idik: new Array(10).fill(0)
});

const statsCache = {
  totalSentGames: 0,
  statusCounts: { completed: 0, inProgress: 0, expired: 0, pending: 0 },
  scoreDistributions: initScoreDistributions(),
  completedCandidateCount: 0,
  completedEmployeeCount: 0,
  titleOptions: DEFAULT_TITLE_OPTIONS,
  titleCounts: {} as TitleCounts,
  fetchedAt: 0,
  initialized: false
};

const statusCountsEqual = (a: StatusCounts, b: StatusCounts) =>
  a.completed === b.completed &&
  a.inProgress === b.inProgress &&
  a.expired === b.expired &&
  a.pending === b.pending;

const scoreDistributionsEqual = (a: ScoreDistributions, b: ScoreDistributions) =>
  a.customerFocus.join('|') === b.customerFocus.join('|') &&
  a.uncertainty.join('|') === b.uncertainty.join('|') &&
  a.ie.join('|') === b.ie.join('|') &&
  a.idik.join('|') === b.idik.join('|');

const titleOptionsEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

const titleCountsEqual = (a: TitleCounts, b: TitleCounts) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
};

const normalizeKey = (value: string) =>
  value.toString().trim().toLowerCase().replace(/\s+/g, ' ');

const scoreRanges = [
  { label: '0-10', midpoint: 5 },
  { label: '10-20', midpoint: 15 },
  { label: '20-30', midpoint: 25 },
  { label: '30-40', midpoint: 35 },
  { label: '40-50', midpoint: 45 },
  { label: '50-60', midpoint: 55 },
  { label: '60-70', midpoint: 65 },
  { label: '70-80', midpoint: 75 },
  { label: '80-90', midpoint: 85 },
  { label: '90-100', midpoint: 95 }
];

const getAverageBucketIndex = (buckets: number[]) => {
  let total = 0;
  let sum = 0;
  buckets.forEach((count, index) => {
    total += count;
    sum += count * scoreRanges[index].midpoint;
  });
  if (!total) return -1;
  const avg = sum / total;
  return Math.min(9, Math.floor(avg / 10));
};

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [totalSentGames, setTotalSentGames] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    completed: 0,
    inProgress: 0,
    expired: 0,
    pending: 0
  });
  const [scoreDistributions, setScoreDistributions] = useState<ScoreDistributions>(initScoreDistributions());
  const [completedCandidateCount, setCompletedCandidateCount] = useState(0);
  const [completedEmployeeCount, setCompletedEmployeeCount] = useState(0);
  const [titleOptions, setTitleOptions] = useState<string[]>(DEFAULT_TITLE_OPTIONS);
  const [titleCounts, setTitleCounts] = useState<TitleCounts>({});
  const [isVisualLoading, setIsVisualLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let loadingTimer: number | undefined;
    const minVisualMs = 1800;

    const finishLoadingWithDelay = (startedAt: number) => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minVisualMs - elapsed);
      loadingTimer = window.setTimeout(() => {
        if (isMounted) {
          setIsVisualLoading(false);
        }
      }, remaining);
    };

    if (statsCache.initialized) {
      setTotalSentGames(statsCache.totalSentGames);
      setStatusCounts(statsCache.statusCounts);
      setScoreDistributions(statsCache.scoreDistributions || initScoreDistributions());
      setCompletedCandidateCount(statsCache.completedCandidateCount || 0);
      setCompletedEmployeeCount(statsCache.completedEmployeeCount || 0);
      setTitleOptions(statsCache.titleOptions || DEFAULT_TITLE_OPTIONS);
      setTitleCounts(statsCache.titleCounts || {});
    }

    const loadStats = async () => {
      const startedAt = Date.now();
      setIsVisualLoading(true);
      try {
        const now = Date.now();
        if (statsCache.initialized && now - statsCache.fetchedAt < 60000) {
          finishLoadingWithDelay(startedAt);
          return;
        }
        const response = await adminAPI.getDashboardStats();
        if (response.data?.success && response.data.stats) {
          const stats = response.data.stats;
          const nextScoreDistributions: ScoreDistributions = {
            customerFocus: stats.scoreDistributions?.customerFocus || new Array(10).fill(0),
            uncertainty: stats.scoreDistributions?.uncertainty || new Array(10).fill(0),
            ie: stats.scoreDistributions?.ie || new Array(10).fill(0),
            idik: stats.scoreDistributions?.idik || new Array(10).fill(0)
          };
          const nextTitleOptions = Array.isArray(stats.titleOptions) && stats.titleOptions.length > 0
            ? stats.titleOptions
            : DEFAULT_TITLE_OPTIONS;
          const nextTitleCounts = stats.titleCounts || {};

          const shouldUpdate =
            !statsCache.initialized ||
            statsCache.totalSentGames !== stats.totalSentGames ||
            !statusCountsEqual(statsCache.statusCounts, stats.statusCounts) ||
            !scoreDistributionsEqual(statsCache.scoreDistributions, nextScoreDistributions) ||
            statsCache.completedCandidateCount !== (stats.completedCandidateCount || 0) ||
            statsCache.completedEmployeeCount !== (stats.completedEmployeeCount || 0) ||
            !titleOptionsEqual(statsCache.titleOptions, nextTitleOptions) ||
            !titleCountsEqual(statsCache.titleCounts, nextTitleCounts);

          statsCache.totalSentGames = stats.totalSentGames;
          statsCache.statusCounts = stats.statusCounts;
          statsCache.scoreDistributions = nextScoreDistributions;
          statsCache.completedCandidateCount = stats.completedCandidateCount || 0;
          statsCache.completedEmployeeCount = stats.completedEmployeeCount || 0;
          statsCache.titleOptions = nextTitleOptions;
          statsCache.titleCounts = nextTitleCounts;
          statsCache.fetchedAt = now;
          statsCache.initialized = true;

          if (shouldUpdate) {
            setTotalSentGames(stats.totalSentGames);
            setStatusCounts(stats.statusCounts);
            setScoreDistributions(nextScoreDistributions);
            setCompletedCandidateCount(stats.completedCandidateCount || 0);
            setCompletedEmployeeCount(stats.completedEmployeeCount || 0);
            setTitleOptions(nextTitleOptions);
            setTitleCounts(nextTitleCounts);
          }
        } else {
          setTotalSentGames(0);
          setStatusCounts({ completed: 0, inProgress: 0, expired: 0, pending: 0 });
          setScoreDistributions(initScoreDistributions());
          setCompletedCandidateCount(0);
          setCompletedEmployeeCount(0);
          setTitleOptions(DEFAULT_TITLE_OPTIONS);
          setTitleCounts({});
        }
      } catch (error) {
        console.error('Dashboard istatistik yükleme hatası:', error);
        setTotalSentGames(0);
        setStatusCounts({ completed: 0, inProgress: 0, expired: 0, pending: 0 });
        setScoreDistributions(initScoreDistributions());
        setCompletedCandidateCount(0);
        setCompletedEmployeeCount(0);
        setTitleOptions(DEFAULT_TITLE_OPTIONS);
        setTitleCounts({});
      } finally {
        finishLoadingWithDelay(startedAt);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
      if (loadingTimer) {
        window.clearTimeout(loadingTimer);
      }
    };
  }, []);

  const statusSummary = useMemo(() => {
    const inProgressTotal = statusCounts.inProgress + statusCounts.pending;
    const total = statusCounts.completed + inProgressTotal + statusCounts.expired;
    const completedPercent = total ? Math.round((statusCounts.completed / total) * 100) : 0;
    return {
      total,
      completedPercent,
      items: [
        { label: t('status.completed'), value: statusCounts.completed, color: '#22c55e' },
        { label: t('status.inProgress'), value: inProgressTotal, color: '#3b82f6' },
        { label: t('status.expired'), value: statusCounts.expired, color: '#d1d5db' }
      ]
    };
  }, [statusCounts, t]);

  const titleItems = useMemo(() => {
    const colors = ['#7fd3e6', '#9f8fbe', '#ff751f', '#ff625f', '#7fd3e6', '#9f8fbe'];
    const icons = ['fa-user-tie', 'fa-users', 'fa-user', 'fa-graduation-cap', 'fa-crown', 'fa-briefcase'];
    const normalizedCounts: TitleCounts = {};
    Object.keys(titleCounts).forEach((key) => {
      normalizedCounts[normalizeKey(key)] = titleCounts[key];
    });

    const items = titleOptions.map((title, index) => {
      const count = normalizedCounts[normalizeKey(title)] || 0;
      return {
        title,
        count,
        color: colors[index % colors.length],
        icon: icons[index % icons.length]
      };
    });

    const maxCount = Math.max(1, ...items.map((item) => item.count));
    return items.map((item) => ({
      ...item,
      widthPercent: Math.max(10, Math.round((item.count / maxCount) * 100))
    }));
  }, [titleCounts, titleOptions]);

  const titleColumns = useMemo(() => {
    const midIndex = Math.ceil(titleItems.length / 2);
    return {
      left: titleItems.slice(0, midIndex),
      right: titleItems.slice(midIndex)
    };
  }, [titleItems]);

  const competencyCards = useMemo(() => ([
    {
      key: 'uncertainty',
      title: t('competency.uncertainty'),
      color: '#7fd3e6',
      lightColor: 'rgba(127, 211, 230, 0.3)',
      trackColor: 'rgba(127, 211, 230, 0.15)'
    },
    {
      key: 'customerFocus',
      title: t('competency.customerFocus'),
      color: '#7fd3e6',
      lightColor: 'rgba(127, 211, 230, 0.3)',
      trackColor: 'rgba(127, 211, 230, 0.15)'
    },
    {
      key: 'ie',
      title: t('competency.ie'),
      color: '#ff751f',
      lightColor: 'rgba(255, 117, 31, 0.3)',
      trackColor: 'rgba(255, 117, 31, 0.15)'
    },
    {
      key: 'idik',
      title: t('competency.idik'),
      color: '#ff751f',
      lightColor: 'rgba(255, 117, 31, 0.3)',
      trackColor: 'rgba(255, 117, 31, 0.15)'
    }
  ]), [t]);

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      background: '#F8F9FA',
      minHeight: '100vh',
      padding: '24px 32px 0 10px',
      color: '#4B5563'
    }}>
      <style>{`
        @keyframes dashboardSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dashboardBarPulse {
          0% { transform: scaleY(0.25); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0.35); opacity: 0.7; }
        }
      `}</style>
      {/* Page Title - Mavi Box */}
      <div style={{
        width: '100%',
        height: '75px',
        background: 'radial-gradient(ellipse 150.93% 36.28% at 50.00% 50.00%, #3B8AFF 0%, #0048B2 100%)',
        borderBottomRightRadius: '16px',
        borderBottomLeftRadius: '16px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '0 32px',
        marginLeft: '0px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}>
          <div style={{
            color: 'white',
            fontSize: '30px',
            fontFamily: 'Inter',
            fontWeight: 700
          }}>
            {t('titles.dashboard')}
          </div>
        </div>
      </div>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg" style={{ background: '#7fd3e6' }}>
          <div className="absolute -right-4 -top-4 opacity-20 rotate-12">
            <i className="fa-solid fa-chart-pie text-4xl" />
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-medium text-white text-opacity-90 mb-1">{t('labels.totalGamesSent')}</h3>
            <div className="text-4xl font-bold">{totalSentGames}</div>
          </div>
        </div>
        <div className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: '#9f8fbe' }}>
          <div className="absolute -right-4 -top-4 opacity-20 rotate-12">
            <i className="fa-solid fa-users text-4xl" />
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-medium text-white text-opacity-90 mb-1">Tamamlanan Değerlendirme/ Aday</h3>
            <div className="text-4xl font-bold">{completedCandidateCount}</div>
          </div>
        </div>
        <div className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: '#ff751f' }}>
          <div className="absolute -right-4 -top-4 opacity-20 rotate-12">
            <i className="fa-solid fa-clock text-4xl" />
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-medium text-white text-opacity-90 mb-1">Tamamlanan Değerlendirme/ Çalışan</h3>
            <div className="text-4xl font-bold">{completedEmployeeCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
            <i className="fa-solid fa-circle-check text-4xl text-gray-400" />
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-medium text-gray-500 mb-1">Tamamlanan Değerlendirme (Çalışan + Aday)</h3>
            <div className="text-4xl font-bold text-gray-800">{statusCounts.completed}</div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5 mb-6">
        <div className="flex items-center gap-2">
          <button className="px-5 py-1.5 bg-white text-gray-600 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-xs border border-gray-100">Tümü</button>
          <button className="px-5 py-1.5 bg-white text-gray-600 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-xs border border-gray-100">Adaylar</button>
          <button
            className="px-5 py-1.5 text-white font-medium rounded-lg shadow-md transition-colors text-xs border"
            style={{ background: '#9f8fbe', borderColor: '#9f8fbe' }}
          >
            Çalışanlar
          </button>
        </div>

        <div className="flex gap-5 flex-col lg:flex-row">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[280px] w-full lg:w-1/2">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Değerlendirme Merkezi Durumları</h2>
            <div className="flex items-center h-full">
              <div className="relative w-1/2 h-full flex items-center justify-center">
                {isVisualLoading ? (
                  <div
                    style={{
                      width: '160px',
                      height: '160px',
                      borderRadius: '50%',
                      background: 'conic-gradient(#22c55e 0deg 120deg, #3b82f6 120deg 240deg, #d1d5db 240deg 360deg)',
                      WebkitMask: 'radial-gradient(farthest-side, transparent 62%, #000 63%)',
                      mask: 'radial-gradient(farthest-side, transparent 62%, #000 63%)',
                      animation: 'dashboardSpin 1.1s linear infinite'
                    }}
                  />
                ) : (
                  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                    {(() => {
                      const radius = 70;
                      const circumference = 2 * Math.PI * radius;
                      let offsetPercent = 0;
                      return statusSummary.items.map((item, index) => {
                        const percent = statusSummary.total ? item.value / statusSummary.total : 0;
                        const dash = circumference * percent;
                        const gap = circumference - dash;
                        const offset = circumference * (1 - offsetPercent);
                        offsetPercent += percent;
                        return (
                          <circle
                            key={`${item.label}-${index}`}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                          />
                        );
                      });
                    })()}
                    <text x="100" y="108" textAnchor="middle" className="text-3xl font-bold fill-gray-800">
                      %{statusSummary.completedPercent}
                    </text>
                  </svg>
                )}
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-4 pl-2">
                {statusSummary.items.map((item) => {
                  const percent = statusSummary.total ? Math.round((item.value / statusSummary.total) * 100) : 0;
                  return (
                    <div key={item.label} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full shadow-sm ring-2" style={{ backgroundColor: item.color, boxShadow: `0 0 0 4px ${item.color}20` }} />
                        <span className="text-gray-600 font-medium text-sm">{item.label}</span>
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-[280px] overflow-hidden w-full lg:w-1/2">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Seviye Dağılımı</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 h-full content-center">
              <div className="space-y-3">
                {titleColumns.left.map((item, index) => (
                  <div key={`${item.title}-left-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}33` }}
                      >
                        <i className={`fa-solid ${item.icon} text-xs`} style={{ color: item.color }} />
                      </div>
                      <span className="text-gray-700 font-medium text-base">{item.title}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-gray-800 font-bold text-base">{item.count}</span>
                      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${item.widthPercent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-l border-gray-100 pl-4">
                {titleColumns.right.map((item, index) => (
                  <div key={`${item.title}-right-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}33` }}
                      >
                        <i className={`fa-solid ${item.icon} text-xs`} style={{ color: item.color }} />
                      </div>
                      <span className="text-gray-700 font-medium text-base">{item.title}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-gray-800 font-bold text-base">{item.count}</span>
                      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${item.widthPercent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {competencyCards.map((card) => {
            const buckets = scoreDistributions[card.key as keyof ScoreDistributions] || [];
            const maxCount = Math.max(1, ...buckets);
            const highlightIndex = getAverageBucketIndex(buckets);
            return (
              <div key={card.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{card.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-[180px] flex flex-col justify-end">
                  <div className="flex items-end justify-between gap-2 h-40 w-full px-2">
                    {scoreRanges.map((range, index) => {
                      const count = buckets[index] || 0;
                      const heightPercent = Math.max(5, Math.round((count / maxCount) * 100));
                      const isHighlighted = index === highlightIndex;
                      const animationDelay = `${index * 0.08}s`;
                      return (
                        <div key={range.label} className="flex flex-col items-center gap-2 group flex-1 h-full justify-end">
                          <div className="relative w-full max-w-[24px] rounded-full h-full" style={{ backgroundColor: card.trackColor }}>
                            <div
                              className="absolute bottom-0 w-full rounded-full transition-all duration-500 group-hover:opacity-90"
                              style={{
                                height: isVisualLoading ? '100%' : `${heightPercent}%`,
                                backgroundColor: isHighlighted ? card.color : card.lightColor,
                                transformOrigin: 'bottom',
                                animationName: isVisualLoading ? 'dashboardBarPulse' : 'none',
                                animationDuration: isVisualLoading ? '1.1s' : '0s',
                                animationTimingFunction: 'ease-in-out',
                                animationIterationCount: isVisualLoading ? 'infinite' : '1',
                                animationDelay: isVisualLoading ? animationDelay : '0s'
                              }}
                            />
                            {!isVisualLoading && (
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded shadow-lg transition-all z-10 whitespace-nowrap">
                                {count} Kişi
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{range.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
