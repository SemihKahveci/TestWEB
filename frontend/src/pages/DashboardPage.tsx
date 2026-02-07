import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { adminAPI } from '../services/api';

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

const allCompetencyKeys = ['customerFocus', 'uncertainty', 'ie', 'idik'] as const;

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const competencyLabelMap = useMemo(() => ({
    customerFocus: t('competency.customerFocus'),
    uncertainty: t('competency.uncertainty'),
    ie: t('competency.ie'),
    idik: t('competency.idik')
  }), [t]);
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
  const [isMobile, setIsMobile] = useState(false);
  const plotlyLoadedRef = useRef(false);
  
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const handleResize = () => {
      setIsMobile(mobileQuery.matches);
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
          name: competencyLabelMap.customerFocus,
          data: stats.scoreDistributions?.customerFocus || new Array(10).fill(0),
          color: '#0d6efd'
        },
        {
          name: competencyLabelMap.uncertainty,
          data: stats.scoreDistributions?.uncertainty || new Array(10).fill(0),
          color: '#6610f2'
        },
        {
          name: competencyLabelMap.ie,
          data: stats.scoreDistributions?.ie || new Array(10).fill(0),
          color: '#d63384'
        },
        {
          name: competencyLabelMap.idik,
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
      labels: [t('status.completed'), t('status.inProgress'), t('status.expired'), t('status.sent')],
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
      showlegend: true,
      legend: { orientation: 'h', x: 0.5, y: -0.15, xanchor: 'center', yanchor: 'top', font: { size: 11 } },
      paper_bgcolor: '#FFFFFF',
      plot_bgcolor: '#FFFFFF',
      margin: { t: 40, r: 20, b: 70, l: 20 }
    };

    plotly.react('game-status-chart', gameStatusData, gameStatusLayout, { responsive: true, displayModeBar: false, displaylogo: false });
  }, [statusCounts, t]);

  useEffect(() => {
    const plotly = window.Plotly;
    if (!plotlyLoadedRef.current || !plotly) return;

    const xLabels = [
      competencyLabelMap.customerFocus,
      competencyLabelMap.uncertainty,
      competencyLabelMap.ie,
      competencyLabelMap.idik
    ];

    const venusTrace = {
      type: 'bar',
      name: 'Venüs',
      x: xLabels,
      y: [competencyCounts.customerFocus, competencyCounts.uncertainty, 0, 0],
      marker: { color: '#0d6efd' },
      text: [competencyCounts.customerFocus, competencyCounts.uncertainty, '', ''],
      textposition: 'inside',
      textfont: { color: '#FFFFFF', size: 12 },
      insidetextanchor: 'middle',
      hoverinfo: 'skip'
    };

    const titanTrace = {
      type: 'bar',
      name: 'Titan',
      x: xLabels,
      y: [0, 0, competencyCounts.ie, competencyCounts.idik],
      marker: { color: '#fd7e14' },
      text: ['', '', competencyCounts.ie, competencyCounts.idik],
      textposition: 'inside',
      textfont: { color: '#FFFFFF', size: 12 },
      insidetextanchor: 'middle',
      hoverinfo: 'skip'
    };

    const competencyLayout = {
      barmode: 'group',
      showlegend: false,
      bargap: 0.01,
      bargroupgap: 0.01,
      xaxis: { tickangle: -20, tickfont: { size: 10 }, automargin: true },
      paper_bgcolor: '#FFFFFF',
      plot_bgcolor: '#f8f9fa',
      margin: { t: 60, r: 20, b: 110, l: 60 },
      uniformtext: { mode: 'hide', minsize: 8 }
    };

    plotly.react('competency-chart', [venusTrace, titanTrace], competencyLayout, { responsive: true, displayModeBar: false, displaylogo: false });
  }, [competencyCounts, competencyLabelMap]);

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
        }
      }];

      const chartLayout = {
        title: { text: comp.name, font: { size: 14, weight: 600 } },
        xaxis: { title: 'Skor Aralığı', titlefont: { size: 11 }, tickfont: { size: 10 } },
        yaxis: { title: t('labels.peopleCount'), titlefont: { size: 11 }, tickfont: { size: 10 } },
        paper_bgcolor: '#FFFFFF',
        plot_bgcolor: '#f8f9fa',
        margin: { t: 60, r: 20, b: 60, l: 50 },
        uniformtext: { mode: 'hide', minsize: 8 }
      };

      plotly.react(`score-distribution-chart-${index + 1}`, chartData, chartLayout, { responsive: true, displayModeBar: false, displaylogo: false });
    });
  }, [scoreDistributions]);

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      background: '#F8F9FA',
      minHeight: '100vh',
      padding: isMobile ? '16px' : '24px 32px 24px 10px',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      touchAction: 'manipulation'
    }}>
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
        <div style={{ color: 'white', fontSize: isMobile ? '22px' : '28px', fontWeight: 700 }}>{t('titles.dashboard')}</div>
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
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: 600 }}>{t('labels.peopleEvaluated')}</div>
              <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>{uniquePeopleCount}</div>
            </div>
            <div style={{ width: '52px', height: '52px', background: '#DBEAFE', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👥</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #16A34A', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: 600 }}>{t('labels.totalGamesSent')}</div>
              <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>{totalSentGames}</div>
            </div>
            <div style={{ width: '52px', height: '52px', background: '#DCFCE7', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📤</div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '16px' : '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>{t('labels.gameSendStatus')}</div>
          <div id="game-status-chart" style={{ height: '300px' }} />
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>{t('labels.competencyGameDistribution')}</div>
          <div id="competency-chart" style={{ height: '360px' }} />
        </div>
      </section>

      <section style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{t('labels.competencyDistributions')}</div>
            </div>
          <div />
        </div>
        <div style={{ overflowX: isMobile ? 'visible' : 'auto', width: '100%', maxWidth: '100%', touchAction: 'manipulation' }}>
          <div style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: '16px', width: '100%' }}>
            {allCompetencyKeys.map((key, index) => (
              <div
                key={key}
                id={`score-distribution-chart-${index + 1}`}
                style={{
                  height: '320px',
                  width: isMobile ? '100%' : '50%',
                  minWidth: isMobile ? '280px' : '340px',
                  maxWidth: isMobile ? '100%' : '560px',
                  flex: isMobile ? '0 0 100%' : '0 0 50%',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '12px',
                  boxSizing: 'border-box',
                  display: 'block'
                }}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;
