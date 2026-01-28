import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

type TabKey = 'trend' | 'summary' | 'full';

type UserResult = {
  code: string;
  name: string;
  email?: string;
  status?: string;
  completionDate?: string;
  sentDate?: string;
  customerFocusScore?: string | number;
  uncertaintyScore?: string | number;
  ieScore?: string | number;
  idikScore?: string | number;
};

type CachedUserResults = {
  latestUser: UserResult | null;
  latestHistory: UserResult[];
};

const PersonResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('trend');
  const [selectedCompetency, setSelectedCompetency] = useState('uyumluluk');
  const [latestUser, setLatestUser] = useState<UserResult | null>(null);
  const [latestHistory, setLatestHistory] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const competencyConfig = useMemo(() => ([
    {
      key: 'uyumluluk',
      name: t('competency.uncertainty'),
      description: t('competency.uncertainty.desc'),
      scoreField: 'uncertaintyScore'
    },
    {
      key: 'musteri',
      name: t('competency.customerFocus'),
      description: t('competency.customerFocus.desc'),
      scoreField: 'customerFocusScore'
    },
    {
      key: 'etkileme',
      name: t('competency.ie'),
      description: t('competency.ie.desc'),
      scoreField: 'ieScore'
    },
    {
      key: 'sinerji',
      name: t('competency.idik'),
      description: t('competency.idik.desc'),
      scoreField: 'idikScore'
    }
  ]), [t]);

  const parseScore = (value?: string | number) => {
    if (value === null || value === undefined || value === '-' || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatScoreRaw = (value?: string | number) => {
    const parsed = parseScore(value);
    if (parsed === null) return '-';
    return Math.round(parsed);
  };

  const toScore10 = (value?: string | number) => {
    const parsed = parseScore(value);
    if (parsed === null) return null;
    return Math.round((parsed / 10) * 10) / 10;
  };

  const formatDateShort = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateLong = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatQuarterLabel = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  };

  const defaultPdfOptions = useMemo(() => ({
    generalEvaluation: true,
    strengths: true,
    interviewQuestions: true,
    whyTheseQuestions: true,
    developmentSuggestions: true,
    competencyScore: true
  }), []);

  const historySorted = useMemo(() => {
    return [...latestHistory].sort((a, b) => {
      const aDate = new Date(a.completionDate || a.sentDate || 0).getTime();
      const bDate = new Date(b.completionDate || b.sentDate || 0).getTime();
      return aDate - bDate;
    });
  }, [latestHistory]);

  const trendByCompetency = useMemo(() => {
    const lastThree = historySorted.slice(-3);
    const base = Object.fromEntries(
      competencyConfig.map((item) => [item.key, [] as { label: string; date: string; value: number }[]])
    );

    lastThree.forEach((row) => {
      competencyConfig.forEach((item) => {
        const score10 = toScore10((row as any)[item.scoreField]);
        if (score10 !== null) {
          base[item.key].push({
            label: formatDateShort(row.completionDate || row.sentDate),
            date: formatDateLong(row.completionDate || row.sentDate),
            value: score10
          });
        }
      });
    });

    if (latestUser) {
      competencyConfig.forEach((item) => {
        if (base[item.key].length === 0) {
          const score10 = toScore10((latestUser as any)[item.scoreField]);
          if (score10 !== null) {
            base[item.key].push({
              label: formatDateShort(latestUser.completionDate || latestUser.sentDate),
              date: formatDateLong(latestUser.completionDate || latestUser.sentDate),
              value: score10
            });
          }
        }
      });
    }

    return base;
  }, [competencyConfig, historySorted, latestUser]);

  const selectedTrend = (trendByCompetency[selectedCompetency] || []).slice(-3);
  const selectedMeta = competencyConfig.find((item) => item.key === selectedCompetency) || competencyConfig[0];
  const axisLabels = useMemo(() => {
    if (selectedTrend.length === 0) return [];
    const span = selectedTrend.length > 1 ? 460 / (selectedTrend.length - 1) : 0;
    return selectedTrend.map((point, i) => ({
      ...point,
      x: 40 + (selectedTrend.length === 1 ? 230 : i * span)
    }));
  }, [selectedTrend]);

  const trendDelta = useMemo(() => {
    if (selectedTrend.length < 2) return null;
    const first = selectedTrend[0]?.value ?? null;
    const last = selectedTrend[selectedTrend.length - 1]?.value ?? null;
    if (first === null || last === null) return null;
    return Math.round((last - first) * 10) / 10;
  }, [selectedTrend]);

  const trendDeltaText = useMemo(() => {
    if (trendDelta === null) {
      return t('labels.notEnoughData');
    }
    const prefix = trendDelta >= 0 ? '+' : '';
    if (language === 'en') {
      return `Change of ${prefix}${trendDelta} points across last ${selectedTrend.length} evaluations`;
    }
    return `Son ${selectedTrend.length} değerlendirmede ${prefix}${trendDelta} puan gelişim`;
  }, [language, selectedTrend.length, trendDelta]);

  const handlePreviewPdf = async () => {
    if (!latestUser?.code) return;
    try {
      setIsPdfLoading(true);
      const pdfParams = new URLSearchParams();
      Object.entries(defaultPdfOptions).forEach(([key, value]) => {
        pdfParams.append(key, value.toString());
      });
      const response = await fetch(`/api/preview-pdf?code=${encodeURIComponent(latestUser.code)}&${pdfParams.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(t('errors.pdfCreateFailed'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setShowPDFPreview(true);
    } catch (error) {
      console.error('PDF preview error:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!latestUser?.code) return;
    try {
      setIsPdfLoading(true);
      const response = await fetch('/api/evaluation/generatePDF', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userCode: latestUser.code,
          selectedOptions: defaultPdfOptions
        })
      });
      if (!response.ok) {
        throw new Error(t('errors.pdfCreateFailed'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const date = latestUser.completionDate ? new Date(latestUser.completionDate) : new Date();
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${date.getFullYear()}`;
      const safeName = (latestUser.name || t('labels.user')).replace(/\s+/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `ANDRON_${t('labels.assessmentReport')}_${safeName}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const scoreCards = [
    { title: t('competency.uncertainty'), icon: 'fa-chart-line', badge: '+12%', color: 'from-blue-500 to-blue-600', competency: 'uyumluluk' },
    { title: t('competency.customerFocus'), icon: 'fa-trophy', badge: t('labels.performanceTopPercent'), color: 'from-green-500 to-green-600', competency: 'musteri' },
    { title: t('competency.ie'), icon: 'fa-star', badge: '8/12', color: 'from-purple-500 to-purple-600', competency: 'etkileme' },
    { title: t('competency.idik'), icon: 'fa-arrow-trend-up', badge: '+3', color: 'from-orange-500 to-orange-600', competency: 'sinerji' }
  ];

  const maxScore = 10;

  useEffect(() => {
    const state = location.state as { selectedUser?: UserResult } | null;
    if (state?.selectedUser) {
      setLatestUser(state.selectedUser);
      setLatestHistory([state.selectedUser]);
      sessionStorage.setItem('personResultsVisited', 'true');
      sessionStorage.setItem('latestUserResults', JSON.stringify({
        latestUser: state.selectedUser,
        latestHistory: [state.selectedUser]
      }));

      const fetchSelectedHistory = async () => {
        try {
          const response = await fetch(`/api/user-results/summary?code=${encodeURIComponent(state.selectedUser!.code)}`, {
            credentials: 'include'
          });
          const data = await response.json();
          if (!data?.success || !data?.latestUser) {
            return;
          }
          const history = Array.isArray(data.history) ? (data.history as UserResult[]) : [];
          const historySafe = history.length > 0 ? history : [data.latestUser as UserResult];
          setLatestUser(data.latestUser as UserResult);
          setLatestHistory(historySafe);
          sessionStorage.setItem('latestUserResults', JSON.stringify({
            latestUser: data.latestUser,
            latestHistory: historySafe
          }));
        } catch (error) {
          // Sessiz geç
        }
      };

      fetchSelectedHistory();
      return;
    }

    if (hasRestoredState) {
      return;
    }

    const hasVisited = sessionStorage.getItem('personResultsVisited') === 'true';
    if (hasVisited) {
      const cachedViewState = sessionStorage.getItem('personResultsState');
      if (cachedViewState) {
        try {
          const parsed = JSON.parse(cachedViewState) as {
            activeTab?: TabKey;
            selectedCompetency?: string;
            latestUser?: UserResult | null;
            latestHistory?: UserResult[];
          };
          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          if (parsed.selectedCompetency) setSelectedCompetency(parsed.selectedCompetency);
          if (parsed.latestUser) setLatestUser(parsed.latestUser);
          if (parsed.latestHistory) setLatestHistory(parsed.latestHistory);
          setHasRestoredState(true);
          return;
        } catch (error) {
          sessionStorage.removeItem('personResultsState');
        }
      }

      const cached = sessionStorage.getItem('latestUserResults');
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CachedUserResults;
          setLatestUser(parsed.latestUser);
          setLatestHistory(parsed.latestHistory || []);
          setHasRestoredState(true);
          return;
        } catch (error) {
          sessionStorage.removeItem('latestUserResults');
        }
      }
    }

    const fetchLatest = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user-results/latest-summary', {
          credentials: 'include'
        });
        const data = await response.json();
        if (!data?.success || !data?.latestUser) {
          setLatestUser(null);
          setLatestHistory([]);
          return;
        }
        const latest = data.latestUser as UserResult;
        const history = Array.isArray(data.history) ? (data.history as UserResult[]) : [];
        const historySafe = history.length > 0 ? history : [latest];

        setLatestUser(latest);
        setLatestHistory(historySafe);
        sessionStorage.setItem('personResultsVisited', 'true');
        sessionStorage.setItem('latestUserResults', JSON.stringify({ latestUser: latest, latestHistory: historySafe }));
      } catch (error) {
        setLatestUser(null);
        setLatestHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasRestoredState) {
      fetchLatest();
    }
  }, [location.state, hasRestoredState]);

  useEffect(() => {
    if (!latestUser) return;
    sessionStorage.setItem('personResultsState', JSON.stringify({
      activeTab,
      selectedCompetency,
      latestUser,
      latestHistory
    }));
    sessionStorage.setItem('personResultsVisited', 'true');
  }, [activeTab, selectedCompetency, latestUser, latestHistory]);

  const selectedUserFromState = (location.state as { selectedUser?: UserResult } | null)?.selectedUser;
  const userForDetail = selectedUserFromState || latestUser;

  return (
    <div className="bg-gray-50 font-inter">
      <div style={{ padding: '24px 32px 0 10px' }}>
        <div
          style={{
            width: '100%',
            height: '75px',
            background: 'radial-gradient(ellipse 150.93% 36.28% at 50.00% 50.00%, #3B8AFF 0%, #0048B2 100%)',
            borderBottomRightRadius: '16px',
            borderBottomLeftRadius: '16px',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '0 32px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: '30px',
              fontFamily: 'Inter',
              fontWeight: 700
            }}
          >
            {t('titles.personResults')}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{latestUser?.name || '—'}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <i className="fa-solid fa-briefcase mr-2 text-gray-400" />
                    <span>{t('labels.sampleRole')}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-calendar mr-2 text-gray-400" />
                    <span>{t('labels.participation')}: {t('labels.sampleParticipation')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">{t('labels.currentEvaluation')}</div>
              <div className="text-lg font-semibold text-gray-900">{formatQuarterLabel(latestUser?.completionDate)}</div>
              <div className="text-sm text-gray-600">{t('labels.completion')}: {formatDateLong(latestUser?.completionDate)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {scoreCards.map((card) => {
            const isClickable = Boolean(card.competency);
            const scoreField = competencyConfig.find((item) => item.key === card.competency)?.scoreField;
            const rawScore = scoreField ? formatScoreRaw((latestUser as any)?.[scoreField]) : '-';
            return (
            <div
              key={card.title}
              className={`bg-gradient-to-br ${card.color} rounded-xl shadow-sm p-6 text-white ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => {
                if (isClickable) {
                  navigate('/person-results/detail', {
                    state: {
                      competency: card.competency,
                      latestUser: userForDetail,
                      latestHistory
                    }
                  });
                }
              }}
              onKeyDown={(event) => {
                if (!isClickable) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate('/person-results/detail', {
                    state: {
                      competency: card.competency,
                      latestUser: userForDetail,
                      latestHistory
                    }
                  });
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <i className={`fa-solid ${card.icon} text-3xl opacity-80`} />
                <div className="rounded-lg px-3 py-1 text-xs font-semibold text-white bg-white/30 shadow-sm">
                  {card.badge}
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{rawScore}</div>
              <div className="text-sm opacity-90">{card.title}</div>
            </div>
          )})}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{t('labels.competencyStatus')}</h3>
                <p className="text-sm text-gray-500">{t('labels.competencyStatusDesc')}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <i className="fa-solid fa-file-lines mr-1" />
                  {t('labels.reportDetails')}
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <i className="fa-solid fa-info-circle text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-900">
                  <div className="font-medium mb-1">{t('labels.evaluationDate')}: {formatDateLong(latestUser?.completionDate)}</div>
                  <div className="text-blue-700">{t('labels.trendTip')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {competencyConfig.map((item, index) => {
                const score10 = toScore10((latestUser as any)?.[item.scoreField]);
                const isActive = selectedCompetency === item.key;
                return (
                <div
                  key={item.key}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    isActive ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => {
                    setSelectedCompetency(item.key);
                    setActiveTab('trend');
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${isActive ? 'text-blue-600' : 'text-green-600'}`}>
                        {score10 ?? '-'}
                      </div>
                      <div className="text-xs text-gray-500">{t('labels.outOf10')}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[{ label: t('labels.yourScore'), value: score10 ?? 0, color: 'bg-green-600' }].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{row.label}</span>
                          <div className="flex items-center">
                            <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                              <div className={`h-2 ${row.color} rounded-full`} style={{ width: `${(row.value / maxScore) * 100}%` }} />
                            </div>
                            <span className="font-medium text-gray-700 w-8">{row.value || '-'}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { key: 'trend', label: t('tabs.trend') },
                  { key: 'summary', label: t('tabs.summary') },
                  { key: 'full', label: t('tabs.fullReport') }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabKey)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'trend' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{t('labels.trendAnalysis')}</h3>
                  <p className="text-sm text-gray-500">{t('labels.lastThreeResults')}</p>
                </div>

                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.selectCompetency')}</label>
                  <select
                    value={selectedCompetency}
                    onChange={(e) => setSelectedCompetency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium cursor-pointer"
                  >
                    {competencyConfig.map((item) => (
                      <option key={item.key} value={item.key}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-8">
                  <div className="h-72 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-4">{selectedMeta.name} - {t('labels.trendLabel')}</div>
                    <div className="h-48">
                      <svg viewBox="0 0 520 200" className="w-full h-full">
                        <defs>
                          <linearGradient id="trend-line" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#2563EB" />
                          </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="520" height="200" fill="white" />
                        <g stroke="#E5E7EB" strokeWidth="1">
                          {[0, 1, 2, 3, 4].map((i) => {
                            const y = 20 + i * 40;
                            return <line key={i} x1="40" y1={y} x2="500" y2={y} />;
                          })}
                        </g>
                        <g stroke="#9CA3AF" strokeWidth="1">
                          <line x1="40" y1="180" x2="500" y2="180" />
                          <line x1="40" y1="20" x2="40" y2="180" />
                        </g>
                        <g fill="#6B7280" fontSize="10">
                          {[10, 8, 6, 4, 2].map((tick, i) => (
                            <text key={tick} x="8" y={24 + i * 40}>{tick}</text>
                          ))}
                        </g>
                        {(() => {
                          if (selectedTrend.length === 0) {
                            return null;
                          }
                          const span = selectedTrend.length > 1 ? 460 / (selectedTrend.length - 1) : 0;
                          const points = selectedTrend.map((point, index) => {
                            const x = 40 + (selectedTrend.length === 1 ? 230 : index * span);
                            const y = 180 - (point.value / maxScore) * 160;
                            return { x, y, value: point.value };
                          });
                          const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                          return (
                            <>
                              <path
                                d={path}
                                fill="none"
                                stroke="#2563EB"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d={path}
                                fill="none"
                                stroke="url(#trend-line)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {points.map((p, i) => (
                                <g key={`${selectedTrend[i]?.label}-${i}`}>
                                  <circle cx={p.x} cy={p.y} r="6" fill="#2563EB" />
                                  <circle cx={p.x} cy={p.y} r="3" fill="#93C5FD" />
                                </g>
                              ))}
                            </>
                          );
                        })()}
                        <g fill="#6B7280" fontSize="11">
                          {axisLabels.map((point) => (
                            <text key={point.label} x={point.x} y="195" textAnchor="middle">
                              {point.label}
                            </text>
                          ))}
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={`grid gap-4 ${selectedTrend.length === 1 ? 'grid-cols-1' : selectedTrend.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {selectedTrend.map((point, index) => (
                    <div key={point.label} className={`rounded-lg p-5 text-center border ${index === selectedTrend.length - 1 ? 'bg-blue-50 border-blue-400 border-2' : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`text-xs uppercase tracking-wide mb-2 ${index === selectedTrend.length - 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                        {point.label}{index === selectedTrend.length - 1 ? ` (${t('labels.currentTag')})` : ''}
                      </div>
                      <div className={`text-4xl font-bold mb-1 ${index === selectedTrend.length - 1 ? 'text-blue-600' : 'text-gray-700'}`}>
                        {point.value}
                      </div>
                      <div className={`text-xs ${index === selectedTrend.length - 1 ? 'text-blue-700' : 'text-gray-600'}`}>
                        {point.date}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <i className="fa-solid fa-arrow-trend-up text-white text-lg" />
                    </div>
                    <p className="text-sm text-green-900 font-medium">
                      {trendDeltaText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{t('labels.currentReport')}</h3>
                  <p className="text-sm text-gray-500">{t('labels.comprehensiveAssessment')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <i className="fa-solid fa-star text-2xl text-blue-600" />
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">{t('labels.performanceExcellent')}</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-1">8.4/10</div>
                    <div className="text-sm font-medium text-blue-800">{t('labels.overallPerformance')}</div>
                    <div className="text-xs text-blue-700 mt-2">{t('labels.previousPeriodChange')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <i className="fa-solid fa-arrow-up text-2xl text-green-600" />
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">{t('labels.performanceGrowing')}</span>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-1">9/12</div>
                    <div className="text-sm font-medium text-green-800">{t('labels.developingCompetency')}</div>
                    <div className="text-xs text-green-700 mt-2">{t('labels.positiveGrowth')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <i className="fa-solid fa-trophy text-2xl text-purple-600" />
                      <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">{t('labels.performanceTopPercent')}</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900 mb-1">92</div>
                    <div className="text-sm font-medium text-purple-800">{t('labels.percentileRank')}</div>
                    <div className="text-xs text-purple-700 mt-2">{t('labels.companyOverall')}</div>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">{t('tabs.executiveSummary')}</h4>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    <p className="mb-4">
                      {t('labels.executiveSummarySample')}
                    </p>
                    <p className="mb-4">
                      {t('labels.executiveSummaryHighlights')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'full' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{t('labels.fullReport')}</h3>
                  <p className="text-sm text-gray-500">{t('labels.comprehensiveAssessment')}</p>
                </div>
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                    <i className="fa-solid fa-file-pdf text-blue-600 text-3xl" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{t('labels.reportTitleQ4')}</h4>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {t('labels.fullReportSummary')}
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium disabled:opacity-60"
                      onClick={handlePreviewPdf}
                      disabled={isPdfLoading || !latestUser}
                    >
                      <i className="fa-solid fa-eye mr-2" /> {t('buttons.viewReport')}
                    </button>
                    <button
                      className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center font-medium disabled:opacity-60"
                      onClick={handleDownloadPdf}
                      disabled={isPdfLoading || !latestUser}
                    >
                      <i className="fa-solid fa-download mr-2" /> {t('buttons.downloadPdf')}
                    </button>
                    <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center font-medium">
                      <i className="fa-solid fa-share-nodes mr-2" /> {t('buttons.share')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPDFPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">{t('labels.pdfPreview')}</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowPDFPreview(false);
                  if (pdfPreviewUrl) {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }
                }}
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="flex-1 bg-white p-5">
              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title={t('labels.pdfPreview')}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {t('labels.pdfLoading')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonResults;
