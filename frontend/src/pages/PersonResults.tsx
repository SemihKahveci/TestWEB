import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

type UserResult = {
  code: string;
  name: string;
  email?: string;
  status?: string;
  completionDate?: string;
  sentDate?: string;
  pozisyon?: string;
  customerFocusScore?: string | number;
  uncertaintyScore?: string | number;
  ieScore?: string | number;
  idikScore?: string | number;
};

type CachedUserResults = {
  latestUser: UserResult | null;
  latestHistory: UserResult[];
  companyAverageScores?: {
    customerFocusScore?: number | null;
    uncertaintyScore?: number | null;
    ieScore?: number | null;
    idikScore?: number | null;
  } | null;
  positionNorms?: {
    customerFocusScore?: string | null;
    uncertaintyScore?: string | null;
    ieScore?: string | null;
    idikScore?: string | null;
  } | null;
};

const PersonResults: React.FC = () => {
  const [selectedCompetency, setSelectedCompetency] = useState('uyumluluk');
  const [latestUser, setLatestUser] = useState<UserResult | null>(null);
  const [latestHistory, setLatestHistory] = useState<UserResult[]>([]);
  const [companyAverageScores, setCompanyAverageScores] = useState<CachedUserResults['companyAverageScores']>(null);
  const [positionNorms, setPositionNorms] = useState<CachedUserResults['positionNorms']>(null);
  const [selectedEvaluationIndex, setSelectedEvaluationIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const preferredSelectionRef = useRef<UserResult | null>(null);
  const preferredResolvedRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const formatTemplate = (template: string, params: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => `${params[key] ?? ''}`);

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

  const maxScore = 100;
  const findPreferredIndex = (list: UserResult[], preferred: UserResult | null) => {
    if (!preferred) return -1;
    return list.findIndex((row) => {
      if (preferred.code && row.code !== preferred.code) return false;
      const preferredDates = [preferred.completionDate, preferred.sentDate].filter(Boolean);
      const rowDates = [row.completionDate, row.sentDate].filter(Boolean);
      if (preferredDates.length > 0 && rowDates.length > 0) {
        const matches = preferredDates.some((date) => rowDates.includes(date as string));
        if (!matches) return false;
      }
      return true;
    });
  };

  const getScoreColor = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return '#9CA3AF';
    if (value <= 20) return '#ff625f';
    if (value <= 50) return '#ff751f';
    if (value <= 70) return '#efd775';
    if (value <= 80) return '#7ed957';
    return '#00bf63';
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

  useEffect(() => {
    if (historySorted.length === 0) {
      setSelectedEvaluationIndex(null);
      return;
    }
    if (preferredSelectionRef.current) {
      const preferredIndex = findPreferredIndex(historySorted, preferredSelectionRef.current);
      if (preferredIndex >= 0) {
        setSelectedEvaluationIndex(preferredIndex);
        preferredResolvedRef.current = true;
        return;
      }
      if (!preferredResolvedRef.current) {
        return;
      }
    }
    setSelectedEvaluationIndex((prev) => {
      if (prev === null || prev < 0 || prev >= historySorted.length) {
        return historySorted.length - 1;
      }
      return prev;
    });
  }, [historySorted.length]);

  const displayHistory = useMemo(() => {
    if (historySorted.length > 0) return historySorted;
    return latestUser ? [latestUser] : [];
  }, [historySorted, latestUser]);

  useEffect(() => {
    if (displayHistory.length === 0) {
      if (selectedEvaluationIndex !== null) {
        setSelectedEvaluationIndex(null);
      }
      return;
    }
    if (preferredSelectionRef.current && !preferredResolvedRef.current) {
      return;
    }
    if (selectedEvaluationIndex === null || selectedEvaluationIndex >= displayHistory.length) {
      setSelectedEvaluationIndex(displayHistory.length - 1);
    }
  }, [displayHistory.length, selectedEvaluationIndex]);

  const displayUser = selectedEvaluationIndex !== null
    ? displayHistory[selectedEvaluationIndex]
    : displayHistory[displayHistory.length - 1];
  const parsePositionNormValue = (value: string | number | null | undefined) => {
    if (value === '-' || value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') return value;
    const raw = String(value);
    if (raw.includes('-')) {
      const [minRaw, maxRaw] = raw.split('-').map((part) => Number(part.trim()));
      if (!Number.isNaN(minRaw) && !Number.isNaN(maxRaw)) {
        return (minRaw + maxRaw) / 2;
      }
    }
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const trendByCompetency = useMemo(() => {
    const lastThree = historySorted.slice(-3);
    const base = Object.fromEntries(
      competencyConfig.map((item) => [item.key, [] as { label: string; date: string; value: number }[]])
    );

    lastThree.forEach((row) => {
      competencyConfig.forEach((item) => {
        const scoreValue = parseScore((row as any)[item.scoreField]);
        if (scoreValue !== null) {
          base[item.key].push({
            label: formatDateShort(row.completionDate || row.sentDate),
            date: formatDateLong(row.completionDate || row.sentDate),
            value: Math.round(scoreValue)
          });
        }
      });
    });

    if (latestUser) {
      competencyConfig.forEach((item) => {
        if (base[item.key].length === 0) {
          const scoreValue = parseScore((latestUser as any)[item.scoreField]);
          if (scoreValue !== null) {
            base[item.key].push({
              label: formatDateShort(latestUser.completionDate || latestUser.sentDate),
              date: formatDateLong(latestUser.completionDate || latestUser.sentDate),
              value: Math.round(scoreValue)
            });
          }
        }
      });
    }

    return base;
  }, [competencyConfig, historySorted, latestUser]);

  const selectedTrend = (trendByCompetency[selectedCompetency] || []).slice(-3);
  const selectedMeta = competencyConfig.find((item) => item.key === selectedCompetency) || competencyConfig[0];
  const companyAverageRaw = parseScore(
    (companyAverageScores as any)?.[selectedMeta?.scoreField]
  );
  const companyAverageDisplay = companyAverageRaw === null ? '-' : Math.round(companyAverageRaw);
  const positionNormRange = (positionNorms as any)?.[selectedMeta?.scoreField] || '-';
  const selectedHistoryIndex = displayHistory.length > 0
    ? (selectedEvaluationIndex === null || selectedEvaluationIndex >= displayHistory.length
      ? displayHistory.length - 1
      : selectedEvaluationIndex)
    : null;
  const selectedTrendIndex = useMemo(() => {
    if (selectedTrend.length === 0) return null;
    if (historySorted.length === 0) return 0;
    if (selectedHistoryIndex === null) return null;
    const startIndex = Math.max(historySorted.length - selectedTrend.length, 0);
    if (selectedHistoryIndex < startIndex) return null;
    return selectedHistoryIndex - startIndex;
  }, [selectedTrend.length, historySorted.length, selectedHistoryIndex]);
  const companyAverageLineY = companyAverageRaw === null
    ? null
    : 180 - (companyAverageRaw / maxScore) * 160;
  const companyAverageLineColor = companyAverageRaw === null
    ? '#9CA3AF'
    : getScoreColor(companyAverageRaw);
  const axisLabels = useMemo(() => {
    if (selectedTrend.length === 0) return [];
    const span = selectedTrend.length > 1 ? 460 / (selectedTrend.length - 1) : 0;
    return selectedTrend.map((point, i) => ({
      ...point,
      x: 40 + (selectedTrend.length === 1 ? 230 : i * span)
    }));
  }, [selectedTrend]);

  const trendDelta = useMemo(() => {
    if (selectedHistoryIndex === null || selectedHistoryIndex <= 0) return null;
    const current = displayHistory[selectedHistoryIndex];
    const prev = displayHistory[selectedHistoryIndex - 1];
    const currentValue = parseScore((current as any)?.[selectedMeta?.scoreField]);
    const prevValue = parseScore((prev as any)?.[selectedMeta?.scoreField]);
    if (currentValue === null || prevValue === null) return null;
    return Math.round(currentValue - prevValue);
  }, [displayHistory, selectedHistoryIndex, selectedMeta?.scoreField]);

  const trendDeltaText = useMemo(() => {
    if (trendDelta === null) {
      return t('labels.notEnoughData');
    }
    const absValue = Math.abs(trendDelta);
    return trendDelta >= 0
      ? formatTemplate(t('labels.lastEvaluationImprovement'), { value: absValue })
      : formatTemplate(t('labels.lastEvaluationDecline'), { value: absValue });
  }, [t, trendDelta, formatTemplate]);

  const handlePreviewPdf = async () => {
    if (!displayUser?.code) return;
    try {
      setIsPdfLoading(true);
      const pdfParams = new URLSearchParams();
      Object.entries(defaultPdfOptions).forEach(([key, value]) => {
        pdfParams.append(key, value.toString());
      });
      const response = await fetch(`/api/preview-pdf?code=${encodeURIComponent(displayUser.code)}&${pdfParams.toString()}`, {
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
      setErrorMessage((error as Error).message || t('errors.pdfCreateFailed'));
      setShowErrorPopup(true);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!displayUser?.code) return;
    try {
      setIsPdfLoading(true);
      const response = await fetch('/api/evaluation/generatePDF', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userCode: displayUser.code,
          selectedOptions: defaultPdfOptions
        })
      });
      if (!response.ok) {
        throw new Error(t('errors.pdfCreateFailed'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const date = displayUser.completionDate ? new Date(displayUser.completionDate) : new Date();
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${date.getFullYear()}`;
      const safeName = (displayUser.name || t('labels.user')).replace(/\s+/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `ANDRON_${t('labels.assessmentReport')}_${safeName}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
      setErrorMessage((error as Error).message || t('errors.pdfCreateFailed'));
      setShowErrorPopup(true);
    } finally {
      setIsPdfLoading(false);
    }
  };

  useEffect(() => {
    if (!isPdfLoading) {
      setPdfProgress(0);
      return;
    }
    setPdfProgress(5);
    const interval = setInterval(() => {
      setPdfProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 3;
        return next >= 95 ? 95 : next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPdfLoading]);

  const scoreCards = [
    { title: t('competency.uncertainty'), icon: 'fa-shield', color: '#7fd3e6', competency: 'uyumluluk' },
    { title: t('competency.customerFocus'), icon: 'fa-users', color: '#9f8fbe', competency: 'musteri' },
    { title: t('competency.ie'), icon: 'fa-comments', color: '#ff751f', competency: 'etkileme' },
    { title: t('competency.idik'), icon: 'fa-handshake', color: '#ff625f', competency: 'sinerji' }
  ];

  useEffect(() => {
    const state = location.state as { selectedUser?: UserResult } | null;
    if (state?.selectedUser) {
      preferredSelectionRef.current = state.selectedUser;
      preferredResolvedRef.current = false;
      setLatestUser(state.selectedUser);
      setLatestHistory([state.selectedUser]);
      setSelectedEvaluationIndex(null);
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
          const preferredIndex = findPreferredIndex(historySafe, preferredSelectionRef.current);
          setLatestUser(data.latestUser as UserResult);
          setLatestHistory(historySafe);
          if (preferredIndex >= 0) {
            setSelectedEvaluationIndex(preferredIndex);
            preferredResolvedRef.current = true;
          } else if (selectedEvaluationIndex === null) {
            setSelectedEvaluationIndex(historySafe.length - 1);
            preferredResolvedRef.current = true;
          }
          setCompanyAverageScores(data.companyAverageScores || null);
          setPositionNorms(data.positionNorms || null);
          sessionStorage.setItem('latestUserResults', JSON.stringify({
            latestUser: data.latestUser,
            latestHistory: historySafe,
            companyAverageScores: data.companyAverageScores || null,
            positionNorms: data.positionNorms || null
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
            selectedCompetency?: string;
            selectedEvaluationIndex?: number | null;
            latestUser?: UserResult | null;
            latestHistory?: UserResult[];
            companyAverageScores?: CachedUserResults['companyAverageScores'];
            positionNorms?: CachedUserResults['positionNorms'];
          };
          if (parsed.selectedCompetency) setSelectedCompetency(parsed.selectedCompetency);
          if (parsed.selectedEvaluationIndex !== undefined) setSelectedEvaluationIndex(parsed.selectedEvaluationIndex);
          if (parsed.latestUser) setLatestUser(parsed.latestUser);
          if (parsed.latestHistory) setLatestHistory(parsed.latestHistory);
          if (parsed.companyAverageScores !== undefined) setCompanyAverageScores(parsed.companyAverageScores || null);
          if (parsed.positionNorms !== undefined) setPositionNorms(parsed.positionNorms || null);
          setHasRestoredState(true);
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
          setCompanyAverageScores(parsed.companyAverageScores || null);
          setPositionNorms(parsed.positionNorms || null);
          setHasRestoredState(true);
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
        setCompanyAverageScores(data.companyAverageScores || null);
        setPositionNorms(data.positionNorms || null);
        sessionStorage.setItem('personResultsVisited', 'true');
        sessionStorage.setItem('latestUserResults', JSON.stringify({
          latestUser: latest,
          latestHistory: historySafe,
          companyAverageScores: data.companyAverageScores || null,
          positionNorms: data.positionNorms || null
        }));
      } catch (error) {
        setLatestUser(null);
        setLatestHistory([]);
        setCompanyAverageScores(null);
        setPositionNorms(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatest();
  }, [location.state, hasRestoredState]);

  useEffect(() => {
      if (!latestUser) return;
      sessionStorage.setItem('personResultsState', JSON.stringify({
        selectedCompetency,
        selectedEvaluationIndex,
        latestUser,
        latestHistory,
        companyAverageScores,
        positionNorms
      }));
    sessionStorage.setItem('personResultsVisited', 'true');
    }, [selectedCompetency, selectedEvaluationIndex, latestUser, latestHistory, companyAverageScores, positionNorms]);

  const selectedUserFromState = (location.state as { selectedUser?: UserResult } | null)?.selectedUser;
  const userForDetail = displayUser || selectedUserFromState || latestUser;

  return (
    <div className="bg-gray-50 font-inter">
      <div style={{ padding: '24px 32px 0 10px' }}>
        <div
          className="header-gradient"
          style={{
            width: '100%',
            height: '75px',
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{displayUser?.name || '—'}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <i className="fa-solid fa-briefcase mr-2 text-gray-400" />
                    <span>{displayUser?.pozisyon || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-calendar mr-2 text-gray-400" />
                    <span>{t('labels.participation')}: {t('labels.sampleParticipation')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={handlePreviewPdf}
                    disabled={isPdfLoading || !displayUser}
                  >
                    <i className="fa-solid fa-eye mr-2" />
                    {t('buttons.viewReport')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleDownloadPdf}
                    disabled={isPdfLoading || !displayUser}
                  >
                    <i className="fa-solid fa-download mr-2" />
                    {isPdfLoading ? t('labels.pdfLoading') : t('buttons.downloadPdf')}
                  </button>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">{t('labels.assessmentPeriodLabel')}</div>
              <select
                value={selectedEvaluationIndex ?? ''}
                onChange={(e) => {
                  preferredSelectionRef.current = null;
                  preferredResolvedRef.current = true;
                  setSelectedEvaluationIndex(Number(e.target.value));
                }}
                className="px-4 py-2.5 bg-white border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold cursor-pointer text-base min-w-[240px] hover:border-blue-400 transition-colors"
                disabled={displayHistory.length === 0}
              >
                {displayHistory.map((item, index) => (
                  <option key={`${item.code}-${index}`} value={index}>
                    {formatQuarterLabel(item.completionDate || item.sentDate)} - {formatDateShort(item.completionDate || item.sentDate)}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-2 flex items-center justify-end">
                <i className="fa-solid fa-info-circle mr-1" />
                <span>{formatTemplate(t('labels.evaluationsAvailable'), { count: displayHistory.length })}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {t('labels.completion')}: {formatDateLong(displayUser?.completionDate || displayUser?.sentDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {scoreCards.map((card) => {
            const isClickable = Boolean(card.competency);
            const scoreField = competencyConfig.find((item) => item.key === card.competency)?.scoreField;
            const rawScore = scoreField ? formatScoreRaw((displayUser as any)?.[scoreField]) : '-';
            return (
            <div
              key={card.title}
              className={`rounded-xl shadow-sm p-6 text-white ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
              style={{ background: card.color }}
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
                <button className="btn btn-primary">
                  <i className="fa-solid fa-file-lines mr-1" />
                  {t('labels.reportDetails')}
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <i className="fa-solid fa-info-circle text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-900">
                  <div className="font-medium mb-1">{t('labels.evaluationDate')}: {formatDateLong(displayUser?.completionDate || displayUser?.sentDate)}</div>
                  <div className="text-blue-700">{t('labels.trendTip')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {competencyConfig.map((item, index) => {
                const scoreRaw = formatScoreRaw((displayUser as any)?.[item.scoreField]);
                const scoreValue = typeof scoreRaw === 'number' ? scoreRaw : 0;
                const scoreDisplayValue = typeof scoreRaw === 'number' ? scoreRaw : null;
                const scoreDisplayColor = getScoreColor(scoreDisplayValue);
                const positionNormDisplay = (positionNorms as any)?.[item.scoreField] || '-';
                const positionNormValue = parsePositionNormValue(positionNormDisplay);
                const companyAvgValue = parseScore((companyAverageScores as any)?.[item.scoreField]);
                const companyAvgDisplay = companyAvgValue === null ? '-' : Math.round(companyAvgValue);
                const isActive = selectedCompetency === item.key;
                return (
                <div
                  key={item.key}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    isActive ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => {
                    setSelectedCompetency(item.key);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: scoreDisplayValue === null ? '#6B7280' : scoreDisplayColor }}
                      >
                        {scoreRaw ?? '-'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: t('labels.yourScore'), value: scoreDisplayValue, display: scoreRaw ?? '-' },
                      { label: t('labels.positionNorm'), value: positionNormValue, display: positionNormDisplay },
                      { label: t('labels.companyAverage'), value: companyAvgValue, display: companyAvgDisplay }
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{row.label}</span>
                          <div className="flex items-center">
                            <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${((row.value ?? 0) / maxScore) * 100}%`,
                                  backgroundColor: getScoreColor(row.value ?? null)
                                }}
                              />
                            </div>
                            <span
                              className="font-medium w-8 whitespace-nowrap"
                              style={{ color: getScoreColor(row.value ?? null) }}
                            >
                              {row.display}
                            </span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                        {companyAverageLineY !== null && (
                          <line
                            x1="40"
                            y1={companyAverageLineY}
                            x2="500"
                            y2={companyAverageLineY}
                            stroke={companyAverageLineColor}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.9"
                          />
                        )}
                        <g stroke="#9CA3AF" strokeWidth="1">
                          <line x1="40" y1="180" x2="500" y2="180" />
                          <line x1="40" y1="20" x2="40" y2="180" />
                        </g>
                        <g fill="#6B7280" fontSize="10">
                          {[100, 80, 60, 40, 20].map((tick, i) => (
                            <text key={tick} x="4" y={24 + i * 40}>{tick}</text>
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
                  {selectedTrend.map((point, index) => {
                    const isSelected = selectedTrendIndex !== null && index === selectedTrendIndex;
                    return (
                      <div
                        key={point.label}
                        className={`rounded-lg p-5 text-center border ${isSelected ? 'bg-blue-50 border-blue-400 border-2' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className={`text-xs uppercase tracking-wide mb-2 ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                          {point.label}{isSelected ? ` (${t('labels.selectedTag')})` : ''}
                        </div>
                        <div className={`text-4xl font-bold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                          {point.value}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {point.date}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-2">
                      {t('labels.positionNorm')}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-orange-600">{positionNormRange}</div>
                      <i className="fa-solid fa-users text-orange-400 text-2xl" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">
                      {t('labels.companyAverage')}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-gray-600">{companyAverageDisplay}</div>
                      <i className="fa-solid fa-building text-gray-400 text-2xl" />
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    trendDelta === null
                      ? 'bg-gray-50 border-gray-200'
                      : trendDelta >= 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        trendDelta === null
                          ? 'bg-gray-400'
                          : trendDelta >= 0
                            ? 'bg-green-500'
                            : 'bg-orange-500'
                      }`}
                    >
                      <i className="fa-solid fa-arrow-trend-up text-white text-lg" />
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        trendDelta === null
                          ? 'text-gray-700'
                          : trendDelta >= 0
                            ? 'text-green-900'
                            : 'text-orange-900'
                      }`}
                    >
                      {trendDeltaText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
      {showPDFPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">{t('labels.pdfPreview')}</h3>
              <button
                className="btn btn-ghost"
                style={{ minWidth: 'auto' }}
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

      {isPdfLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-[420px] p-6 text-center">
            <div className="text-base font-semibold text-gray-900 mb-2">
              {t('labels.pdfLoading')}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              PDF oluşturuluyor ve indiriliyor, lütfen bekleyin.
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">{pdfProgress}%</div>
            <div className="mt-4 flex items-center justify-center">
              <button
                className="btn btn-secondary"
                onClick={() => setIsPdfLoading(false)}
              >
                {t('buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-[420px] p-6 text-center">
            <div className="text-base font-semibold text-gray-900 mb-2">
              {t('labels.error')}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {errorMessage}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowErrorPopup(false);
                setErrorMessage('');
              }}
            >
              {t('buttons.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonResults;
