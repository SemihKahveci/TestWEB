import React, { useCallback, useEffect, useRef, useState } from 'react';
import { evaluationAPI, adminAPI } from '../services/api';

declare global {
  interface Window {
    Plotly?: {
      newPlot: (id: string, data: any, layout: any, config?: any) => void;
      react: (id: string, data: any, layout: any, config?: any) => void;
      purge: (id: string) => void;
    };
  }
}

const plotlyScriptId = 'plotly-cdn-script';
const statsCache = {
  totalSentGames: 0,
  uniquePeopleCount: 0,
  statusCounts: { completed: 0, inProgress: 0, expired: 0, pending: 0 },
  competencyCounts: { customerFocus: 0, uncertainty: 0, ie: 0, idik: 0 },
  scoreDistributions: [] as Array<{ name: string; data: number[]; color: string }>,
  fetchedAt: 0,
  initialized: false
};

const statusCountsEqual = (
  a: { completed: number; inProgress: number; expired: number; pending: number },
  b: { completed: number; inProgress: number; expired: number; pending: number }
) =>
  a.completed === b.completed &&
  a.inProgress === b.inProgress &&
  a.expired === b.expired &&
  a.pending === b.pending;

const competencyCountsEqual = (
  a: { customerFocus: number; uncertainty: number; ie: number; idik: number },
  b: { customerFocus: number; uncertainty: number; ie: number; idik: number }
) =>
  a.customerFocus === b.customerFocus &&
  a.uncertainty === b.uncertainty &&
  a.ie === b.ie &&
  a.idik === b.idik;

const scoreDistributionsEqual = (
  a: Array<{ name: string; data: number[]; color: string }>,
  b: Array<{ name: string; data: number[]; color: string }>
) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].name !== b[i].name || a[i].color !== b[i].color) return false;
    if (a[i].data.length !== b[i].data.length) return false;
    for (let j = 0; j < a[i].data.length; j += 1) {
      if (a[i].data[j] !== b[i].data[j]) return false;
    }
  }
  return true;
};

interface UserResult {
  code: string;
  name: string;
  email: string;
  status: string;
  sentDate: string;
  completionDate: string;
  expiryDate: string;
  customerFocusScore: number | string;
  uncertaintyScore: number | string;
  ieScore: number | string;
  idikScore: number | string;
}

const allCompetencies = [
  'Liderlik',
  'İletişim',
  'Problem Çözme',
  'Takım Çalışması',
  'Stratejik Düşünme',
  'Analitik Düşünme'
];

const DashboardPage: React.FC = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [totalSentGames, setTotalSentGames] = useState(0);
  const [uniquePeopleCount, setUniquePeopleCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    completed: 0,
    inProgress: 0,
    expired: 0,
    pending: 0
  });
  const [competencyCounts, setCompetencyCounts] = useState({
    customerFocus: 0,
    uncertainty: 0,
    ie: 0,
    idik: 0
  });
  const [scoreDistributions, setScoreDistributions] = useState<Array<{ name: string; data: number[]; color: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [forceCompact, setForceCompact] = useState(false);
  const plotlyLoadedRef = useRef(false);
  const shouldCompact = isCompact || forceCompact;
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([
    'Liderlik',
    'İletişim',
    'Problem Çözme',
    'Takım Çalışması',
    'Stratejik Düşünme',
    'Analitik Düşünme'
  ]);
  
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const handleResize = () => {
      const isMobileMatch = mobileQuery.matches;
      const availableWidth = window.innerWidth - (isMobileMatch ? 0 : 280);
      setIsMobile(isMobileMatch);
      setIsCompact(availableWidth < 1200);
    };

    handleResize();
    mobileQuery.addEventListener('change', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      mobileQuery.removeEventListener('change', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClick = () => setFilterOpen(false);
    if (filterOpen) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [filterOpen]);

  const loadResults = useCallback(async () => {
    try {
      setIsLoadingResults(true);
      const response = await evaluationAPI.getAll(currentPage, 10, debouncedSearchTerm, 'Tamamlandı', true);
      if (response.data?.success) {
        setResults(response.data.results || []);
        if (response.data.pagination) {
          setTotalCount(response.data.pagination.total);
          setTotalPages(response.data.pagination.totalPages);
        } else {
          setTotalCount(response.data.results?.length || 0);
          setTotalPages(1);
        }
      } else {
        setResults([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Dashboard sonuç yükleme hatası:', error);
      setResults([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setIsLoadingResults(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    if (statsCache.initialized) {
      setTotalSentGames(statsCache.totalSentGames);
      setUniquePeopleCount(statsCache.uniquePeopleCount);
      setStatusCounts(statsCache.statusCounts);
      setCompetencyCounts(statsCache.competencyCounts);
      setScoreDistributions(statsCache.scoreDistributions || []);
    }

    const loadStats = async () => {
      try {
        const now = Date.now();
        if (statsCache.initialized && now - statsCache.fetchedAt < 60000) {
          return;
        }
        const response = await adminAPI.getDashboardStats();
        if (response.data?.success && response.data.stats) {
          const stats = response.data.stats;

          const scoreDistributions = [
            {
              name: 'Müşteri Odaklılık',
              data: stats.scoreDistributions?.customerFocus || new Array(10).fill(0),
              color: '#0d6efd'
            },
            {
              name: 'Belirsizlik Yönetimi',
              data: stats.scoreDistributions?.uncertainty || new Array(10).fill(0),
              color: '#6610f2'
            },
            {
              name: 'İnsanları Etkileme',
              data: stats.scoreDistributions?.ie || new Array(10).fill(0),
              color: '#d63384'
            },
            {
              name: 'Güven Veren İşbirliği ve Sinerji',
              data: stats.scoreDistributions?.idik || new Array(10).fill(0),
              color: '#fd7e14'
            }
          ];

          const shouldUpdate =
            !statsCache.initialized ||
            statsCache.totalSentGames !== stats.totalSentGames ||
            statsCache.uniquePeopleCount !== stats.uniquePeopleCount ||
            !statusCountsEqual(statsCache.statusCounts, stats.statusCounts) ||
            !competencyCountsEqual(statsCache.competencyCounts, stats.competencyCounts) ||
            !scoreDistributionsEqual(statsCache.scoreDistributions, scoreDistributions);

          statsCache.totalSentGames = stats.totalSentGames;
          statsCache.uniquePeopleCount = stats.uniquePeopleCount;
          statsCache.statusCounts = stats.statusCounts;
          statsCache.competencyCounts = stats.competencyCounts;
          statsCache.scoreDistributions = scoreDistributions;
          statsCache.fetchedAt = now;
          statsCache.initialized = true;

          if (shouldUpdate) {
            setTotalSentGames(stats.totalSentGames);
            setUniquePeopleCount(stats.uniquePeopleCount);
            setStatusCounts(stats.statusCounts);
            setCompetencyCounts(stats.competencyCounts);
            setScoreDistributions(scoreDistributions);
          }
        } else {
          setTotalSentGames(0);
          setUniquePeopleCount(0);
          setStatusCounts({ completed: 0, inProgress: 0, expired: 0, pending: 0 });
          setCompetencyCounts({ customerFocus: 0, uncertainty: 0, ie: 0, idik: 0 });
          setScoreDistributions([]);
        }
      } catch (error) {
        console.error('Dashboard istatistik yükleme hatası:', error);
        setTotalSentGames(0);
        setUniquePeopleCount(0);
        setStatusCounts({ completed: 0, inProgress: 0, expired: 0, pending: 0 });
        setCompetencyCounts({ customerFocus: 0, uncertainty: 0, ie: 0, idik: 0 });
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    if (results.length === 0) {
      setForceCompact(false);
      return;
    }

    const checkOverflow = () => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const hasOverflow = scrollWidth > window.innerWidth + 1;
      setForceCompact(hasOverflow);
    };

    const raf = window.requestAnimationFrame(checkOverflow);
    const timeout = window.setTimeout(checkOverflow, 150);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [results, isCompact]);

  useEffect(() => {
    const loadPlotly = () => {
      if (window.Plotly) return Promise.resolve();
      if (document.getElementById(plotlyScriptId)) {
        return new Promise<void>((resolve) => {
          const script = document.getElementById(plotlyScriptId) as HTMLScriptElement;
          script.addEventListener('load', () => resolve());
        });
      }

      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.id = plotlyScriptId;
        script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const renderStaticCharts = () => {
      const plotly = window.Plotly;
      if (!plotly) return;
    };

    let isCancelled = false;
    loadPlotly().then(() => {
      if (!isCancelled) {
        plotlyLoadedRef.current = true;
        renderStaticCharts();
      }
    });

    return () => {
      isCancelled = true;
      if (window.Plotly) {
        if (document.getElementById('game-status-chart')) {
          window.Plotly.purge('game-status-chart');
        }
        if (document.getElementById('competency-chart')) {
          window.Plotly.purge('competency-chart');
        }
        for (let i = 1; i <= 6; i += 1) {
          const chartId = `score-distribution-chart-${i}`;
          if (document.getElementById(chartId)) {
            window.Plotly.purge(chartId);
          }
        }
      }
    };
  }, []);

  useEffect(() => {
    const plotly = window.Plotly;
    if (!plotlyLoadedRef.current || !plotly) return;

    const gameStatusData = [{
      type: 'pie',
      labels: ['Tamamlandı', 'Oyun Devam Ediyor', 'Süresi Doldu', 'Gönderildi'],
      values: [statusCounts.completed, statusCounts.inProgress, statusCounts.expired, statusCounts.pending],
      marker: {
        colors: ['#28a745', '#ffc107', '#dc3545', '#0d6efd'],
        line: { color: '#ffffff', width: 2 }
      },
      hole: 0.4,
      textinfo: 'none',
      hoverinfo: 'label+percent',
      pull: [0.05, 0.05, 0.05, 0.05],
      rotation: 90
    }];

    const gameStatusLayout = {
      title: { text: 'Genel Durum', font: { size: 16 } },
      showlegend: true,
      legend: { orientation: 'v', x: 1.02, y: 0.5, xanchor: 'left', yanchor: 'middle', font: { size: 11 } },
      paper_bgcolor: '#FFFFFF',
      plot_bgcolor: '#FFFFFF',
      margin: { t: 40, r: 140, b: 20, l: 20 }
    };

    plotly.react('game-status-chart', gameStatusData, gameStatusLayout, { responsive: true, displayModeBar: false, displaylogo: false });
  }, [statusCounts]);

  useEffect(() => {
    const plotly = window.Plotly;
    if (!plotlyLoadedRef.current || !plotly) return;

    const xLabels = [
      'Müşteri Odaklılık',
      'Belirsizlik Yönetimi',
      'İnsanları Etkileme',
      'Güven Veren İşbirliği ve Sinerji'
    ];

    const venusTrace = {
      type: 'bar',
      name: 'Venüs',
      x: xLabels,
      y: [competencyCounts.customerFocus, competencyCounts.uncertainty, 0, 0],
      marker: { color: '#0d6efd' },
      text: [
        competencyCounts.customerFocus,
        competencyCounts.uncertainty,
        '',
        ''
      ],
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 11 }
    };

    const titanTrace = {
      type: 'bar',
      name: 'Titan',
      x: xLabels,
      y: [0, 0, competencyCounts.ie, competencyCounts.idik],
      marker: { color: '#fd7e14' },
      text: [
        '',
        '',
        competencyCounts.ie,
        competencyCounts.idik
      ],
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 11 }
    };

    const competencyLayout = {
      title: { text: 'Gönderilen Oyun Sayısı', font: { size: 16 } },
      barmode: 'group',
      xaxis: { title: 'Yetkinlik' },
      yaxis: { title: 'Oyun Sayısı' },
      paper_bgcolor: '#FFFFFF',
      plot_bgcolor: '#f8f9fa',
      margin: { t: 60, r: 20, b: 80, l: 60 },
      uniformtext: { mode: 'hide', minsize: 8 }
    };

    plotly.react('competency-chart', [venusTrace, titanTrace], competencyLayout, { responsive: true, displayModeBar: false, displaylogo: false });
  }, [competencyCounts]);

  useEffect(() => {
    const plotly = window.Plotly;
    if (!plotlyLoadedRef.current || !plotly) return;

    const scoreRanges = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'];
    const datasets = scoreDistributions;

    datasets.forEach((comp, index) => {
      const chartData = [{
        x: scoreRanges,
        y: comp.data,
        type: 'bar',
        name: comp.name,
        marker: {
          color: comp.color,
          line: { color: comp.color, width: 2 },
          opacity: 0.8
        },
        text: comp.data,
        textposition: 'outside',
        cliponaxis: false,
        textfont: { size: 10 }
      }];

      const chartLayout = {
        title: { text: comp.name, font: { size: 14, weight: 600 } },
        xaxis: { title: 'Skor Aralığı', titlefont: { size: 11 }, tickfont: { size: 10 } },
        yaxis: { title: 'Kişi Sayısı', titlefont: { size: 11 }, tickfont: { size: 10 } },
        paper_bgcolor: '#FFFFFF',
        plot_bgcolor: '#f8f9fa',
        margin: { t: 60, r: 20, b: 60, l: 50 },
        uniformtext: { mode: 'hide', minsize: 8 }
      };

      plotly.react(`score-distribution-chart-${index + 1}`, chartData, chartLayout, { responsive: true, displayModeBar: false, displaylogo: false });
    });
  }, [scoreDistributions]);

  const toggleCompetency = (competency: string) => {
    setSelectedCompetencies((prev) => {
      if (prev.includes(competency)) {
        return prev.filter((item) => item !== competency);
      }
      return [...prev, competency];
    });
  };

  const clearFilters = () => {
    setSelectedCompetencies([]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatScore = (score: number | string) => {
    if (score === null || score === undefined || score === '-' || score === 0 || score === '0') return '-';
    return typeof score === 'number' ? score.toFixed(1) : score;
  };

  const getScoreColorClass = (score: number | string) => {
    if (score === '-' || score === 0 || score === '0' || isNaN(Number(score))) return '';
    const numScore = parseFloat(score.toString());
    if (numScore <= 37) return 'red';
    if (numScore <= 65) return 'yellow';
    if (numScore <= 89.99999999999) return 'green';
    return 'red';
  };

  const renderScoreBadge = (score: number | string) => {
    const color = getScoreColorClass(score);
    const backgroundColor = color === 'red' ? '#FF0000' : color === 'yellow' ? '#FFD700' : color === 'green' ? '#00FF00' : 'transparent';
    const textColor = color === 'red' ? '#FFF' : color === 'yellow' ? '#000' : color === 'green' ? '#000' : '#8A92A6';

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor,
        color: textColor
      }}>
        {formatScore(score)}
      </span>
    );
  };

  const getScoreBuckets = (values: Array<number | string>) => {
    const buckets = new Array(10).fill(0);
    values.forEach((value) => {
      if (value === null || value === undefined || value === '-' || value === '0' || value === 0) {
        return;
      }
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return;
      const clamped = Math.max(0, Math.min(100, parsed));
      const index = Math.min(9, Math.floor(clamped / 10));
      buckets[index] += 1;
    });
    return buckets;
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F8F9FA', minHeight: '100vh', padding: isMobile ? '16px' : '24px 32px 24px 10px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{
        width: '100%',
        height: isMobile ? '64px' : '75px',
        background: 'linear-gradient(90deg, #2563EB 0%, #1E40AF 100%)',
        borderBottomRightRadius: '16px',
        borderBottomLeftRadius: '16px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: isMobile ? '0 16px' : '0 32px',
        marginBottom: '24px'
      }}>
        <div style={{ color: 'white', fontSize: isMobile ? '22px' : '28px', fontWeight: 700 }}>Kontrol Paneli</div>
      </div>

      <section style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: isMobile ? '12px' : '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #2563EB', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: 600 }}>Değerlendirme Gönderilen Kişi Sayısı</div>
              <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>{uniquePeopleCount}</div>
            </div>
            <div style={{ width: '52px', height: '52px', background: '#DBEAFE', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👥</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #16A34A', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: 600 }}>Toplam Gönderilen Oyun Sayısı</div>
              <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>{totalSentGames}</div>
            </div>
            <div style={{ width: '52px', height: '52px', background: '#DCFCE7', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📤</div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '16px' : '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Oyun Gönderim Durumu</div>
          <div id="game-status-chart" style={{ height: '300px' }} />
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Yetkinliğe Göre Oyun Dağılımı</div>
          <div id="competency-chart" style={{ height: '300px' }} />
        </div>
      </section>

      <section style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Yetkinlik Skor Dağılımları</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>Her bir yetkinliğin hangi skor aralığında yığıldığını gösteren grafik.</div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setFilterOpen((prev) => !prev);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#2563EB',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              🔍 Filtrele
            </button>
            {filterOpen && (
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '44px',
                  width: '260px',
                  background: 'white',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  zIndex: 10
                }}
              >
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Yetkinlikleri Seç</div>
                    <button
                      onClick={clearFilters}
                      style={{ fontSize: '12px', color: '#2563EB', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      Temizle
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {allCompetencies.map((competency) => (
                      <label key={competency} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedCompetencies.includes(competency)}
                          onChange={() => toggleCompetency(competency)}
                        />
                        <span style={{ fontSize: '13px', color: '#111827' }}>{competency}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[1, 2, 3, 4].map((chart) => (
              <div
                key={chart}
                id={`score-distribution-chart-${chart}`}
                style={{
                  height: '320px',
                  width: '100%',
                  maxWidth: '420px',
                  flex: '1 1 320px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '12px',
                  boxSizing: 'border-box'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Kişi Sonuçları</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>Kişi Skorları sayfası ile aynı sonuçlar.</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadResults}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#F3F4F6', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fas fa-sync-alt" />
              Yenile
            </button>
            <button
              onClick={() => {}}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#16A34A', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fas fa-file-excel" />
              Sonuçları İndir
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Kişi adına göre akıllı arama yapın..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
          {isLoadingResults ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>Sonuçlar yükleniyor...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>Gösterilecek sonuç bulunamadı.</div>
          ) : shouldCompact ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.map((result, index) => (
                <div key={`${result.code}-${index}`} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', background: index % 2 === 1 ? '#F8FAFF' : 'white' }}>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: '6px' }}>{result.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
                    Tamamlanma Tarihi: {formatDate(result.completionDate)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Müşteri Odaklılık</div>
                      {renderScoreBadge(result.customerFocusScore)}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Belirsizlik Yönetimi</div>
                      {renderScoreBadge(result.uncertaintyScore)}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>İnsanları Etkileme</div>
                      {renderScoreBadge(result.ieScore)}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Güven Veren İşbirliği</div>
                      {renderScoreBadge(result.idikScore)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', maxWidth: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: '#F9FAFB', color: '#6B7280', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>Ad Soyad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>Tamamlanma Tarihi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>Müşteri Odaklılık</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>Belirsizlik Yönetimi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>İnsanları Etkileme</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>Güven Veren İşbirliği ve Sinerji</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={`${result.code}-${index}`} style={{ background: index % 2 === 1 ? '#EFF6FF' : 'white', borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>{result.name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280', wordBreak: 'break-word' }}>{formatDate(result.completionDate)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', wordBreak: 'break-word' }}>{renderScoreBadge(result.customerFocusScore)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', wordBreak: 'break-word' }}>{renderScoreBadge(result.uncertaintyScore)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', wordBreak: 'break-word' }}>{renderScoreBadge(result.ieScore)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', wordBreak: 'break-word' }}>{renderScoreBadge(result.idikScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalCount)} arası, toplam {totalCount} kayıt
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentPage === 1 ? '#F3F4F6' : 'white',
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentPage === 1 ? '#F3F4F6' : 'white',
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                ‹
              </button>
              {(() => {
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                const pages: React.ReactNode[] = [];

                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => setCurrentPage(1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis-start" style={{ padding: '0 6px', color: '#9CA3AF', fontSize: '12px' }}>...</span>
                    );
                  }
                }

                for (let page = startPage; page <= endPage; page += 1) {
                  pages.push(
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: currentPage === page ? '#2563EB' : 'white',
                        color: currentPage === page ? 'white' : '#374151',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {page}
                    </button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis-end" style={{ padding: '0 6px', color: '#9CA3AF', fontSize: '12px' }}>...</span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentPage === totalPages ? '#F3F4F6' : 'white',
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentPage === totalPages ? '#F3F4F6' : 'white',
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                »
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
