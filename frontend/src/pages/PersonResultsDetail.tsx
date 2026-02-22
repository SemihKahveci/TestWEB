import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

type DetailTab = 'executive-summary' | 'competency-details' | 'report-access' | 'ai-assistant';
type CompetencyKey = 'uyumluluk' | 'musteri' | 'etkileme' | 'sinerji';
type CompetencySubTab = 'general-evaluation' | 'strengths-development' | 'interview-questions' | 'development-plan';

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
};

type ReportDetail = {
  generalEvaluation?: string;
  strengths?: string;
  developmentAreas?: string;
  executiveSummaryStrengths?: string;
  executiveSummaryDevelopment?: string;
  interviewQuestions?: string;
  whyTheseQuestions?: string;
  developmentPlan?: string;
};

const PersonResultsDetail: React.FC = () => {
  const AI_SUMMARY_BASE_URL =
    (import.meta as any).env?.VITE_AI_SUMMARY_URL ??
    ((import.meta as any).env?.DEV ? 'http://localhost:3000' : '');
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DetailTab>('executive-summary');
  const [activeCompetency, setActiveCompetency] = useState<CompetencyKey>('uyumluluk');
  const [competencySubTab, setCompetencySubTab] = useState<CompetencySubTab>('general-evaluation');
  const [latestUser, setLatestUser] = useState<UserResult | null>(null);
  const [latestHistory, setLatestHistory] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfSizeLabel, setPdfSizeLabel] = useState<string | null>(null);
  const [pdfPageCountLabel, setPdfPageCountLabel] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const toastTimerRef = useRef<number | null>(null);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiFileName, setAiFileName] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasExplicitUser, setHasExplicitUser] = useState(false);
  const [reportDetails, setReportDetails] = useState<Record<string, ReportDetail>>({});
  const [openDevPlans, setOpenDevPlans] = useState<Record<string, boolean>>({});

  const competencyConfig = useMemo(() => ([
    {
      key: 'uyumluluk',
      title: t('competency.uncertainty'),
      scoreField: 'uncertaintyScore',
      activeColor: '#7fd3e6',
      inactiveColor: '#a5e0ee',
      icon: 'fa-shield'
    },
    {
      key: 'musteri',
      title: t('competency.customerFocus'),
      scoreField: 'customerFocusScore',
      activeColor: '#9f8fbe',
      inactiveColor: '#bcb1d2',
      icon: 'fa-users'
    },
    {
      key: 'etkileme',
      title: t('competency.ie'),
      scoreField: 'ieScore',
      activeColor: '#ff751f',
      inactiveColor: '#ff9e62',
      icon: 'fa-comments'
    },
    {
      key: 'sinerji',
      title: t('competency.idik'),
      scoreField: 'idikScore',
      activeColor: '#ff625f',
      inactiveColor: '#ff918f',
      icon: 'fa-handshake'
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

  const formatDateLong = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatQuarterLabel = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1).replace('.', ',')} MB`;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const aiSuggestions = useMemo(
    () => [
      'Bu raporu tek sayfada özetle',
      'Güçlü yönleri maddeler halinde çıkar',
      'Gelişim alanlarına göre 3 aksiyon öner',
      'Mülakat soruları üret',
      'Bu sonuçlar ne demek?'
    ],
    []
  );

  const competencyOptions = useMemo(() => ([
    { value: 'uyumluluk', label: `${t('competency.uncertainty')} (${formatScoreRaw(latestUser?.uncertaintyScore)})` },
    { value: 'musteri', label: `${t('competency.customerFocus')} (${formatScoreRaw(latestUser?.customerFocusScore)})` },
    { value: 'etkileme', label: `${t('competency.ie')} (${formatScoreRaw(latestUser?.ieScore)})` },
    { value: 'sinerji', label: `${t('competency.idik')} (${formatScoreRaw(latestUser?.idikScore)})` }
  ]), [latestUser, t]);

  const defaultPdfOptions = useMemo(() => ({
    generalEvaluation: true,
    strengths: true,
    interviewQuestions: true,
    whyTheseQuestions: true,
    developmentSuggestions: true,
    competencyScore: true
  }), []);

  const competencyTypeMap = useMemo(() => ({
    uyumluluk: 'BY',
    musteri: 'MO',
    etkileme: 'IE',
    sinerji: 'IDIK'
  }), []);

  useEffect(() => {
    setCompetencySubTab('general-evaluation');
    setOpenDevPlans({
      'dev-plan-1': false,
      'dev-plan-2': false,
      'dev-plan-3': false
    });
  }, [activeCompetency]);

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
      const headerPages = response.headers.get('x-pdf-pages');
      const blob = await response.blob();
      setPdfSizeLabel(formatFileSize(blob.size));
      if (headerPages && Number.isFinite(Number(headerPages))) {
        setPdfPageCountLabel(`${Number(headerPages)} ${language === 'tr' ? 'sayfa' : 'pages'}`);
      }
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
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
      const headerPages = response.headers.get('x-pdf-pages');
      const blob = await response.blob();
      setPdfSizeLabel(formatFileSize(blob.size));
      if (headerPages && Number.isFinite(Number(headerPages))) {
        setPdfPageCountLabel(`${Number(headerPages)} ${language === 'tr' ? 'sayfa' : 'pages'}`);
      }
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

  const handleSharePdf = async () => {
    if (!latestUser?.code) return;
    try {
      setIsPdfLoading(true);
      const response = await fetch('/api/evaluation/share-pdf', {
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
      const data = await response.json();
      const shareUrl = data?.url;
      if (!shareUrl) {
        throw new Error('Paylaşım linki oluşturulamadı');
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Paylaşım linki kopyalandı.', 'success');
      } else {
        window.prompt('Paylaşım linki', shareUrl);
        showToast('Paylaşım linki oluşturuldu.', 'info');
      }
    } catch (error) {
      console.error('PDF share error:', error);
      showToast('Paylaşım linki oluşturulamadı.', 'error');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleAiUpload = async () => {
    if (!aiFile) {
      setAiError('Lütfen bir PDF dosyası seçin.');
      return;
    }
    if (!AI_SUMMARY_BASE_URL) {
      setAiError('AI Summary servisi bulunamadı.');
      return;
    }
    try {
      setIsAiLoading(true);
      setAiError(null);
      const formData = new FormData();
      formData.append('file', aiFile);
      formData.append('language', language === 'en' ? 'en' : 'tr');
      const response = await fetch(`${AI_SUMMARY_BASE_URL}/api/chat/init`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const detail =
          errorPayload?.details || errorPayload?.error || 'Dosya yüklenemedi';
        throw new Error(detail);
      }
      const data = await response.json();
      setAiSessionId(data?.sessionId ?? null);
      setAiFileName(data?.fileName ?? aiFile.name);
      setAiMessages([
        {
          role: 'assistant',
          text: 'Dosya yüklendi. Sorularını yazabilirsin.'
        }
      ]);
      setAiInput('');
      showToast('PDF yüklendi.', 'success');
    } catch (error) {
      console.error('AI upload error:', error);
      setAiError((error as Error).message || 'Dosya yüklenirken hata oluştu.');
      showToast('Dosya yüklenemedi.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSend = async () => {
    const question = aiInput.trim();
    if (!question) return;
    if (!aiSessionId) {
      setAiError('Önce PDF yüklemelisin.');
      return;
    }
    if (!AI_SUMMARY_BASE_URL) {
      setAiError('AI Summary servisi bulunamadı.');
      return;
    }
    try {
      setIsAiLoading(true);
      setAiError(null);
      setAiMessages((prev) => [...prev, { role: 'user', text: question }]);
      setAiInput('');
      const response = await fetch(`${AI_SUMMARY_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: aiSessionId,
          message: question,
          language: language === 'en' ? 'en' : 'tr'
        })
      });
      if (!response.ok) {
        throw new Error('Yanıt alınamadı');
      }
      const data = await response.json();
      const answerText = data?.answer ?? 'Yanıt alınamadı.';
      setAiMessages((prev) => [...prev, { role: 'assistant', text: answerText }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Şu anda cevap oluşturulamıyor.' }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiReset = () => {
    setAiSessionId(null);
    setAiFileName(null);
    setAiMessages([]);
    setAiInput('');
    setAiFile(null);
    setAiError(null);
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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const state = location.state as {
      competency?: CompetencyKey;
      latestUser?: UserResult | null;
      selectedUser?: UserResult | null;
      latestHistory?: UserResult[];
    } | null;
    if (state?.competency) {
      setActiveCompetency(state.competency);
    }
    const incomingUser = state?.latestUser || state?.selectedUser || null;
    if (incomingUser) {
      setLatestUser(incomingUser);
      setHasExplicitUser(true);
    }
    if (state?.latestHistory) {
      setLatestHistory(state.latestHistory);
    }
  }, [location.state]);

  useEffect(() => {
    const state = location.state as { latestUser?: UserResult | null; selectedUser?: UserResult | null } | null;
    if (hasExplicitUser || state?.latestUser || state?.selectedUser) {
      return;
    }
    const cached = sessionStorage.getItem('latestUserResults');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CachedUserResults;
        if (!latestUser) {
          setLatestUser(parsed.latestUser);
        }
        if (latestHistory.length === 0) {
          setLatestHistory(parsed.latestHistory || []);
        }
      } catch (error) {
        sessionStorage.removeItem('latestUserResults');
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
          return;
        }
        const latest = data.latestUser as UserResult;
        const history = Array.isArray(data.history) ? (data.history as UserResult[]) : [];
        const historySafe = history.length > 0 ? history : [latest];

        setLatestUser(latest);
        setLatestHistory(historySafe);
        sessionStorage.setItem('latestUserResults', JSON.stringify({ latestUser: latest, latestHistory: historySafe }));
      } catch (error) {
        // Sessiz geç
      } finally {
        setIsLoading(false);
      }
    };

    if (!latestUser || latestHistory.length === 0) {
      fetchLatest();
    }
  }, [hasExplicitUser, latestHistory.length, latestUser]);

  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!latestUser?.code) return;
      try {
        const response = await fetch(`/api/user-results/report-details?code=${encodeURIComponent(latestUser.code)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data?.success && data?.reports) {
          setReportDetails(data.reports);
        }
      } catch (error) {
        // Sessiz geç
      }
    };

    fetchReportDetails();
  }, [latestUser?.code]);

  const competencyCopy = useMemo(() => ({
    uyumluluk: {
      title: t('competency.uncertainty'),
      overviewTitle: `${t('competency.uncertainty')} ${t('labels.about')}`,
      overviewText: language === 'en'
        ? 'Measures the ability to set long-term goals, analyze market trends, and make decisions aligned with organizational vision.'
        : 'Bu yetkinlik, uzun vadeli hedefleri belirleme, pazar trendlerini analiz etme ve organizasyonel vizyonla uyumlu kararlar alma becerisini ölçer.',
      strengths: language === 'en'
        ? ['Visionary perspective', 'Data-driven decisions', 'Systems thinking']
        : ['Vizyoner bakış açısı', 'Veri odaklı karar alma', 'Sistemsel düşünme'],
      development: language === 'en'
        ? ['Short-term tactical execution', 'Scenario planning practice']
        : ['Kısa vadeli taktiksel uygulama', 'Senaryo planlama pratiği'],
      questions: language === 'en'
        ? [
          'Tell us how you made a complex strategic decision when data was insufficient.',
          'Share an example of a long-term plan that failed due to changing market conditions.'
        ]
        : [
          'Karmaşık bir stratejik kararı, verilerin yetersiz olduğu bir durumda nasıl aldığınızı anlatır mısınız?',
          'Uzun vadeli bir planın, değişen pazar koşulları nedeniyle başarısız olduğu bir örneği paylaşın.'
        ],
      plan: language === 'en'
        ? [
          { title: 'Track Industry Trends', text: 'Review monthly industry reports and share them with the team.' },
          { title: 'Scenario Planning', text: 'Create at least 3 scenario analyses for the next quarter.' }
        ]
        : [
          { title: 'Sektör Trendlerini Takip', text: 'Aylık sektör raporlarını inceleyip ekip ile paylaşın.' },
          { title: 'Senaryo Planlaması', text: 'Gelecek çeyrek için en az 3 farklı senaryo analizi yapın.' }
        ]
    },
    musteri: {
      title: t('competency.customerFocus'),
      overviewTitle: `${t('competency.customerFocus')} ${t('labels.about')}`,
      overviewText: language === 'en'
        ? 'Measures the capability to guide teams, inspire others, and lead change.'
        : 'Ekipleri yönlendirme, ilham verme ve değişimi yönetme kabiliyetini ölçer.',
      strengths: language === 'en'
        ? ['Inspiring communication', 'Building trust', 'Stakeholder management']
        : ['İlham veren iletişim', 'Güven inşası', 'Paydaş yönetimi'],
      development: language === 'en'
        ? ['Difficult conversations', 'Executive influence']
        : ['Zor konuşmalar', 'Üst yönetim etkisi'],
      questions: language === 'en'
        ? [
          'How did you influence a decision without formal authority?',
          'How did you lead a team that resisted change?'
        ]
        : [
          'Resmi otorite olmadan bir kararı nasıl etkilediniz?',
          'Değişime direnç gösteren bir ekibi nasıl yönettiniz?'
        ],
      plan: language === 'en'
        ? [
          { title: 'Mentoring', text: 'Provide mentoring to junior team members.' },
          { title: 'Executive Presentations', text: 'Present regularly to senior leadership.' }
        ]
        : [
          { title: 'Mentorluk', text: 'Kıdemsiz ekip üyelerine mentorluk yapın.' },
          { title: 'Yönetici Sunumu', text: 'Üst yönetime düzenli sunumlar yapın.' }
        ]
    },
    etkileme: {
      title: t('competency.ie'),
      overviewTitle: `${t('competency.ie')} ${t('labels.about')}`,
      overviewText: language === 'en'
        ? 'Measures the ability to analyze complex problems, identify root causes, and develop solutions.'
        : 'Karmaşık problemleri analiz etme, kök nedenleri bulma ve çözüm geliştirme becerisini ölçer.',
      strengths: language === 'en'
        ? ['Root cause analysis', 'Structured approach', 'Creative solutions']
        : ['Kök neden analizi', 'Yapısal yaklaşım', 'Yaratıcı çözümler'],
      development: language === 'en'
        ? ['Balancing speed and depth', 'Collaborative problem solving']
        : ['Hız ve derinlik dengesi', 'Ekipli problem çözme'],
      questions: language === 'en'
        ? [
          'Describe your approach to a problem with no clear solution.',
          'Share a time when your first solution did not work.'
        ]
        : [
          'Açık çözümü olmayan bir problemde yaklaşımınızı anlatır mısınız?',
          'İlk çözümünüzün işe yaramadığı bir durumu paylaşın.'
        ],
      plan: language === 'en'
        ? [
          { title: 'Problem Solving Workshop', text: 'Run quarterly workshops.' },
          { title: 'Case Analysis', text: 'Analyze sample cases and share outcomes.' }
        ]
        : [
          { title: 'Problem Çözme Atölyesi', text: 'Çeyreklik atölyeler düzenleyin.' },
          { title: 'Vaka Analizi', text: 'Örnek vakaları analiz edip paylaşın.' }
        ]
    },
    sinerji: {
      title: t('competency.idik'),
      overviewTitle: `${t('competency.idik')} ${t('labels.about')}`,
      overviewText: language === 'en'
        ? 'Represents the ability to build trust within teams, strengthen collaboration, and improve alignment on shared goals.'
        : 'Bu yetkinlik, ekip içinde güven oluşturma, işbirliğini güçlendirme ve ortak hedeflere uyumu artırma becerisini temsil eder.',
      strengths: language === 'en'
        ? ['Building trust', 'Commitment to shared goals', 'Team cohesion']
        : ['Güven inşa etme', 'Ortak hedeflere bağlılık', 'Ekip uyumu'],
      development: language === 'en'
        ? ['Consistency in communication', 'Mutual feedback culture']
        : ['İletişimde tutarlılık', 'Karşılıklı geri bildirim kültürü'],
      questions: language === 'en'
        ? [
          'What steps would you take to build trust within the team?',
          'How would you handle a situation that made collaboration difficult?'
        ]
        : [
          'Ekip içinde güveni artırmak için hangi adımları atarsın?',
          'İşbirliğini zorlaştıran bir durumu nasıl ele aldığını paylaşır mısın?'
        ],
      plan: language === 'en'
        ? [
          { title: 'Trust Workshops', text: 'Plan regular trust and communication workshops within the team.' },
          { title: 'Feedback Rhythm', text: 'Strengthen collaboration with monthly feedback meetings.' }
        ]
        : [
          { title: 'Güven Atölyeleri', text: 'Ekip içinde düzenli güven ve iletişim atölyeleri planla.' },
          { title: 'Geri Bildirim Ritmi', text: 'Aylık geri bildirim toplantılarıyla işbirliğini güçlendir.' }
        ]
    }
  }), [language, t]);

  const activeContent = competencyCopy[activeCompetency];
  const activeReportType = competencyTypeMap[activeCompetency];
  const activeReport = activeReportType ? reportDetails[activeReportType] : undefined;
  const activeScoreField = competencyConfig.find((item) => item.key === activeCompetency)?.scoreField;
  const activeScoreValue = activeScoreField ? parseScore((latestUser as any)?.[activeScoreField]) : null;
  const hasCompetencyScore = activeScoreValue !== null && activeScoreValue > 0;
  const toggleDevPlan = (key: string) => {
    setOpenDevPlans((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderLines = (text?: string) => {
    if (!text || text === '-') return null;
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => (
        <p key={`${line}-${index}`} className="text-sm text-gray-700 leading-relaxed">
          {line}
        </p>
      ));
  };

  const renderNumberedLines = (text?: string, badgeColor?: string, cardClassName?: string) => {
    if (!text || text === '-') return null;
    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const items: Array<{ title: string; description?: string }> = [];
    const hasTitleMarkers = lines.some((line) => /^(başlık|baslik)\b/i.test(line));
    const hasDetailMarkers = lines.some((line) => /^detay\b/i.test(line));

    if (hasTitleMarkers || hasDetailMarkers) {
      let mode: 'none' | 'title' | 'detail' = 'none';
      let currentTitle = '';
      let currentDetails: string[] = [];

      const flush = () => {
        if (!currentTitle && currentDetails.length === 0) return;
        if (!currentTitle && currentDetails.length > 0) {
          currentTitle = currentDetails.shift() || '';
        }
        items.push({
          title: currentTitle.trim(),
          description: currentDetails.length > 0 ? currentDetails.join(' ').trim() : undefined
        });
        currentTitle = '';
        currentDetails = [];
        mode = 'none';
      };

      lines.forEach((rawLine) => {
        if (/^(başlık|baslik)\b/i.test(rawLine)) {
          flush();
          const titleText = rawLine.replace(/^(başlık|baslik)\b\s*[:\-–—]?\s*/i, '').trim();
          currentTitle = titleText;
          mode = 'title';
          return;
        }

        if (/^detay\b/i.test(rawLine)) {
          const detailText = rawLine.replace(/^detay\b\s*[:\-–—]?\s*/i, '').trim();
          if (detailText) {
            currentDetails.push(detailText);
          }
          mode = 'detail';
          return;
        }

        if (mode === 'title') {
          currentTitle = currentTitle ? `${currentTitle} ${rawLine}` : rawLine;
          return;
        }

        if (mode === 'detail') {
          currentDetails.push(rawLine);
          return;
        }
      });

      flush();
    } else {
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        const separators = [':', ' - ', ' – ', ' — '];
        const match = separators
          .map((sep) => ({ sep, idx: line.indexOf(sep) }))
          .find((item) => item.idx > 0);
        if (match) {
          items.push({
            title: line.slice(0, match.idx).trim(),
            description: line.slice(match.idx + match.sep.length).trim()
          });
          i += 1;
          continue;
        }

        const firstDot = line.indexOf('.');
        if (firstDot > 0 && firstDot < line.length - 1) {
          items.push({
            title: line.slice(0, firstDot).trim(),
            description: line.slice(firstDot + 1).trim()
          });
          i += 1;
          continue;
        }

        const nextLine = lines[i + 1];
        if (nextLine) {
          items.push({ title: line, description: nextLine });
          i += 2;
          continue;
        }

        items.push({ title: line });
        i += 1;
      }
    }

    return items.map((item, index) => (
      <div
        key={`${item.title}-${index}`}
        className={
          cardClassName
            ? `${cardClassName} flex items-start gap-4`
            : 'rounded-xl p-5 flex items-start gap-4'
        }
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${badgeColor || ''}`}>
          {index + 1}
        </div>
        <div className="mt-1">
          <h4 className="font-medium text-gray-900 text-base mb-2">{item.title}</h4>
          {item.description && (
            <p className="text-base text-gray-700 leading-relaxed">{item.description}</p>
          )}
        </div>
      </div>
    ));
  };

  const parseInterviewQuestions = (text?: string) => {
    if (!text || text === '-') return [];
    const lines = text
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const sections: Array<{
      title?: string;
      rows: Array<{
        developmentArea?: string;
        interviewQuestion?: string;
        followUpQuestions: string[];
      }>;
    }> = [];

    const rows: Array<{
      developmentArea?: string;
      interviewQuestion?: string;
      followUpQuestions: string[];
    }> = [];

    let current = { developmentArea: '', interviewQuestion: '', followUpQuestions: [] as string[] };
    let mode: 'area' | 'question' | 'followup' | null = null;
    let currentTitle = '';

    const flush = () => {
      if (
        current.developmentArea ||
        current.interviewQuestion ||
        current.followUpQuestions.length > 0
      ) {
        rows.push({
          developmentArea: current.developmentArea || undefined,
          interviewQuestion: current.interviewQuestion || undefined,
          followUpQuestions: current.followUpQuestions
        });
      }
      current = { developmentArea: '', interviewQuestion: '', followUpQuestions: [] };
      mode = null;
    };

    const flushSection = () => {
      flush();
      if (rows.length > 0) {
        sections.push({
          title: currentTitle || undefined,
          rows: [...rows]
        });
        rows.length = 0;
      }
      currentTitle = '';
    };

    lines.forEach((line) => {
      if (/^(başlık|baslik)\b/i.test(line)) {
        const cleaned = line.replace(/^(başlık|baslik)\b\s*[:\-–—]?\s*/i, '').trim();
        flushSection();
        if (cleaned) {
          currentTitle = cleaned;
        }
        return;
      }

      const areaMatch = line.match(/^(gelişim alanı|gelisim alani)\b\s*[:\-–—]?\s*(.*)$/i);
      if (areaMatch) {
        if (current.developmentArea || current.interviewQuestion || current.followUpQuestions.length) {
          flush();
        }
        current.developmentArea = areaMatch[2]?.trim() || '';
        mode = 'area';
        return;
      }

      const questionMatch = line.match(/^(mülakat sorusu|mulakat sorusu)\b\s*[:\-–—]?\s*(.*)$/i);
      if (questionMatch) {
        current.interviewQuestion = questionMatch[2]?.trim() || '';
        mode = 'question';
        return;
      }

      const followMatch = line.match(/^(devam sorusu|takip sorusu)\b\s*[:\-–—]?\s*(.*)$/i);
      if (followMatch) {
        const followText = followMatch[2]?.trim();
        if (followText) {
          current.followUpQuestions.push(followText);
        }
        mode = 'followup';
        return;
      }

      if (mode === 'area') {
        current.developmentArea = current.developmentArea
          ? `${current.developmentArea} ${line}`
          : line;
        return;
      }

      if (mode === 'question') {
        current.interviewQuestion = current.interviewQuestion
          ? `${current.interviewQuestion} ${line}`
          : line;
        return;
      }

      if (mode === 'followup') {
        current.followUpQuestions.push(line);
        return;
      }

      if (!current.developmentArea) {
        current.developmentArea = line;
      } else if (!current.interviewQuestion) {
        current.interviewQuestion = line;
      } else {
        current.followUpQuestions.push(line);
      }
    });

    flushSection();
    if (sections.length === 0 && rows.length > 0) {
      sections.push({ rows: [...rows] });
    }
    return sections;
  };

  const parseDevelopmentPlanChunk = (text?: string) => {
    if (!text || text === '-') return [];
    const lines = text
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const sections: Array<{
      title: string;
      items: Array<{ title: string; content: string[] }>;
    }> = [];

    let currentSection: { title: string; items: Array<{ title: string; content: string[] }> } | null = null;
    let currentItem: { title: string; content: string[] } | null = null;
    let expectSectionTitle = false;
    let expectItemTitle = false;

    const isAltHeadingMarker = (value: string) => /^(alt başlık|alt baslik)\b/i.test(value);
    const isSubHeading = (value: string) =>
      /^(hedef|günlük kullanım|gunluk kullanim|günlük işlerde kullanım|gunluk islerde kullanim|eğitim önerileri|egitim onerileri|eğitimler|egitimler|podcast\s*&\s*tedx|uygulama)\b/i.test(value);
    const isInlineContentMarker = (value: string) =>
      /^(günlük soru|gunluk soru|aylık|aylik|çeyrek bazlı|ceyrek bazli)\b/i.test(value);

    const normalizeSectionTitle = (value: string) => {
      const withoutPrefix = value.replace(/^(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*/i, '');
      return withoutPrefix.replace(/^\d+[\).\s\-–—:]*/g, '').trim();
    };

    const normalizeLine = (value: string) => value.replace(/^\uFEFF/, '').trim();

    const flushItem = () => {
      if (!currentSection || !currentItem) return;
      if (currentItem.title || currentItem.content.length > 0) {
        currentSection.items.push(currentItem);
      }
      currentItem = null;
    };

    const flushSection = () => {
      flushItem();
      if (currentSection && (currentSection.title || currentSection.items.length > 0)) {
        sections.push(currentSection);
      }
      currentSection = null;
    };

    lines.forEach((rawLine) => {
      const line = normalizeLine(rawLine);
      const planMatch = line.match(
        /^(?:.*?)(gelişim planı|gelisim plani)\b(?:\s*\d+[\).\s\-–—:]*)?\s*[:\-–—]?\s*(.*)$/i
      );
      if (planMatch) {
        flushSection();
        const rawTitle = planMatch[2]?.trim() || '';
        const titleText = normalizeSectionTitle(rawTitle);
        currentSection = { title: titleText, items: [] };
        expectSectionTitle = !titleText;
        return;
      }

      if (expectSectionTitle) {
        const cleanedTitle = normalizeSectionTitle(line);
        if (!currentSection) {
          currentSection = { title: cleanedTitle, items: [] };
        } else {
          currentSection.title = cleanedTitle;
        }
        expectSectionTitle = false;
        return;
      }

      if (expectItemTitle) {
        if (!currentItem) {
          currentItem = { title: rawLine, content: [] };
        } else {
          currentItem.title = rawLine;
        }
        expectItemTitle = false;
        return;
      }

      const lineMatch = line.match(/^(.+?)\s*[:\-–—]\s*(.*)$/);
      const headingCandidate = (lineMatch ? lineMatch[1] : line).trim();
      const contentTail = lineMatch ? lineMatch[2]?.trim() : '';

      if (isInlineContentMarker(headingCandidate)) {
        if (!currentItem) {
          currentItem = { title: '', content: [] };
        }
        const inlineText = contentTail ? `${headingCandidate}: ${contentTail}` : headingCandidate;
        currentItem.content.push(inlineText);
        return;
      }

      if (isAltHeadingMarker(headingCandidate)) {
        flushItem();
        if (!currentItem) {
          currentItem = { title: contentTail, content: [] };
        } else {
          currentItem.title = contentTail;
        }
        if (!contentTail) {
          expectItemTitle = true;
        }
        return;
      }

      if (isSubHeading(headingCandidate)) {
        flushItem();
        currentItem = { title: headingCandidate, content: [] };
        if (contentTail) {
          currentItem.content.push(contentTail);
        }
        return;
      }

      if (!currentSection) {
        currentSection = { title: '', items: [] };
      }

      if (!currentItem) {
        currentItem = { title: headingCandidate, content: [] };
        if (contentTail && contentTail !== headingCandidate) {
          currentItem.content.push(contentTail);
        }
        return;
      }

      currentItem.content.push(line);
    });

    flushSection();
    return sections;
  };

  const parseDevelopmentPlan = (text?: string) => {
    if (!text || text === '-') return [];
    const lines = text.split(/\r?\n/);
    const blocks: string[][] = [];
    let current: string[] = [];

    const isPlanHeaderLine = (value: string) =>
      /gelişim planı|gelisim plani/i.test(value.replace(/\u00A0/g, ' '));

    lines.forEach((rawLine) => {
      const line = rawLine.trimEnd();
      if (isPlanHeaderLine(line) && current.length > 0) {
        blocks.push(current);
        current = [line];
        return;
      }
      current.push(line);
    });

    if (current.length > 0) {
      blocks.push(current);
    }

    if (blocks.length <= 1) {
      return parseDevelopmentPlanChunk(text);
    }

    return blocks
      .map((block) => block.join('\n').trim())
      .filter(Boolean)
      .flatMap((chunk) => parseDevelopmentPlanChunk(chunk));
  };

  const developmentPlanSections = useMemo(
    () => parseDevelopmentPlan(activeReport?.developmentPlan),
    [activeReport?.developmentPlan]
  );

  const normalizedDevelopmentPlanSections = useMemo(() => {
    const normalizeItemTitle = (value: string) => value.replace(/^\uFEFF/, '').trim();
    const isPlanTitle = (value: string) => {
      const normalized = normalizeItemTitle(value).toLowerCase();
      return normalized.startsWith('gelişim planı') || normalized.startsWith('gelisim plani');
    };
    const normalizePlanTitle = (value: string) =>
      value.replace(/^(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*/i, '').trim();

    const expanded: typeof developmentPlanSections = [];

    developmentPlanSections.forEach((section) => {
      const items = section.items || [];
      const planIndices = items
        .map((item, index) => (isPlanTitle(item.title || '') ? index : -1))
        .filter((index) => index >= 0);

      if (planIndices.length <= 1) {
        expanded.push(section);
        return;
      }

      const firstIndex = planIndices[0];
      if (firstIndex > 0) {
        expanded.push({
          title: section.title || '',
          items: items.slice(0, firstIndex)
        });
      }

      planIndices.forEach((titleIndex, idx) => {
        const nextIndex = planIndices[idx + 1] ?? items.length;
        const titleItem = items[titleIndex];
        const titleText =
          titleItem?.content?.[0]?.trim() ||
          normalizePlanTitle(normalizeItemTitle(titleItem?.title || ''));
        expanded.push({
          title: titleText || section.title || '',
          items: items.slice(titleIndex + 1, nextIndex)
        });
      });
    });

    return expanded;
  }, [developmentPlanSections]);

  return (
    <div className="bg-gray-50 font-inter min-h-screen">
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
            marginBottom: '12px'
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
            {t('titles.personReport')}
          </div>
        </div>
        <button
          onClick={() => navigate('/person-results', { state: { selectedUser: latestUser } })}
          aria-label={t('labels.goToPersonResults')}
          className="btn btn-secondary"
        >
          <i className="fa-solid fa-arrow-left" />
          {t('labels.goToPersonResults')}
        </button>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{latestUser?.name || '—'}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <i className="fa-solid fa-briefcase mr-2 text-gray-400" />
                    <span>{latestUser?.pozisyon || '-'}</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {competencyConfig.map((item) => {
              const isSelectable = true;
              const isActive = activeCompetency === item.key;
              const scoreValue = formatScoreRaw((latestUser as any)?.[item.scoreField]);
              return (
                <div
                  key={`${item.title}-${item.key}`}
                  className={`rounded-xl shadow-sm p-6 text-white transition-all ${
                    isSelectable ? 'cursor-pointer hover:shadow-md' : ''
                  } ${isActive ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-gray-50' : 'opacity-60'}`}
                  style={{ background: isActive ? item.activeColor : item.inactiveColor }}
                  role={isSelectable ? 'button' : undefined}
                  tabIndex={isSelectable ? 0 : undefined}
                  onClick={() => {
                    if (isSelectable) {
                      setActiveCompetency(item.key as CompetencyKey);
                      setActiveTab('executive-summary');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!isSelectable) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveCompetency(item.key as CompetencyKey);
                      setActiveTab('executive-summary');
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <i className={`fa-solid ${item.icon} text-3xl opacity-80`} />
                  </div>
                  <div className="text-3xl font-bold mb-1">{scoreValue}</div>
                  <div className="text-sm opacity-90">{item.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex px-6" role="tablist">
              {[
                { key: 'executive-summary', label: t('tabs.executiveSummary'), icon: 'fa-file-lines' },
                { key: 'competency-details', label: t('tabs.competencyDetails'), icon: 'fa-list-check' },
                { key: 'report-access', label: t('tabs.reportAccess'), icon: 'fa-file-pdf' },
                { key: 'ai-assistant', label: t('tabs.aiAssistant'), icon: 'fa-robot' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={activeTab === tab.key ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ borderRadius: 0, fontSize: '14px' }}
                  onClick={() => setActiveTab(tab.key as DetailTab)}
                  role="tab"
                >
                  <i className={`fa-solid ${tab.icon} mr-2`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'executive-summary' && (
            <div className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fa-solid fa-circle-check text-green-600 mr-3" />
                    {t('labels.strengths')}
                  </h3>
                  <div className="space-y-4">
                    {activeReport?.executiveSummaryStrengths ? (
                      <div className="space-y-4">
                        {renderNumberedLines(
                          activeReport.executiveSummaryStrengths,
                          'bg-green-600',
                          'bg-green-50 border border-green-200 rounded-lg p-5'
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600">-</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fa-solid fa-arrow-trend-up text-orange-600 mr-3" />
                    {t('labels.developmentAreas')}
                  </h3>
                  <div className="space-y-4">
                    {activeReport?.executiveSummaryDevelopment ? (
                      <div className="space-y-4">
                        {renderNumberedLines(
                          activeReport.executiveSummaryDevelopment,
                          'bg-orange-600',
                          'bg-orange-50 border border-orange-200 rounded-lg p-5'
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600">-</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competency-details' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('labels.competencyDetailsHeader')}</h2>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">{t('labels.competencySelect')}</label>
                  <select
                    value={activeCompetency}
                    onChange={(event) => setActiveCompetency(event.target.value as CompetencyKey)}
                    className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {competencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex" role="tablist">
                    {[
                      { key: 'general-evaluation', label: t('labels.generalEvaluation') },
                      { key: 'strengths-development', label: t('labels.strengthsDev') },
                      { key: 'interview-questions', label: t('labels.interviewQuestions') },
                      { key: 'development-plan', label: t('labels.developmentPlan') }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        className={competencySubTab === tab.key ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ flex: 1, borderRadius: 0, fontSize: '14px' }}
                        onClick={() => setCompetencySubTab(tab.key as CompetencySubTab)}
                        role="tab"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-8">
                  {competencySubTab === 'general-evaluation' && (
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeContent.overviewTitle}</h3>
                      {!hasCompetencyScore ? (
                        <p className="text-gray-700 leading-relaxed">-</p>
                      ) : (
                        <div className="space-y-3 text-gray-800">
                          {activeReport?.generalEvaluation
                            ? renderLines(activeReport.generalEvaluation)
                            : <p className="leading-relaxed">{activeContent.overviewText}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {competencySubTab === 'strengths-development' && (
                    !hasCompetencyScore ? (
                      <div className="text-gray-700">-</div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-center space-x-2 mb-6">
                            <i className="fa-solid fa-circle-check text-green-600 text-lg" />
                            <h3 className="text-lg font-bold text-gray-900">{t('labels.strengths')}</h3>
                          </div>
                          <div className="space-y-4">
                            {activeReport?.strengths ? (
                              <div className="space-y-4">
                                {renderNumberedLines(
                                  activeReport.strengths,
                                  'bg-green-500',
                                  'bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow'
                                )}
                              </div>
                            ) : (
                              activeContent.strengths.map((item, index) => (
                                <div
                                  key={item}
                                  className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">{item}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{activeContent.overviewText}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-6">
                            <i className="fa-solid fa-arrow-trend-up text-orange-500 text-lg" />
                            <h3 className="text-lg font-bold text-gray-900">{t('labels.developmentAreas')}</h3>
                          </div>
                          <div className="space-y-4">
                            {activeReport?.developmentAreas ? (
                              <div className="space-y-4">
                                {renderNumberedLines(
                                  activeReport.developmentAreas,
                                  'bg-orange-500',
                                  'bg-orange-50 border border-orange-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow'
                                )}
                              </div>
                            ) : (
                              activeContent.development.map((item, index) => (
                                <div
                                  key={item}
                                  className="bg-orange-50 border border-orange-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">{item}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{activeContent.overviewText}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {competencySubTab === 'interview-questions' && (
                    !hasCompetencyScore ? (
                      <div className="text-gray-700">-</div>
                    ) : (
                      <div className="space-y-6">
                        {activeReport?.interviewQuestions ? (
                          parseInterviewQuestions(activeReport.interviewQuestions).map((section, sectionIndex) => (
                            <div key={`interview-section-${sectionIndex}`} className="space-y-4">
                              <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/4 uppercase tracking-wider"
                                      >
                                        {t('labels.developmentArea')}
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/3 uppercase tracking-wider"
                                      >
                                        {t('labels.interviewQuestion')}
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/3 uppercase tracking-wider"
                                      >
                                        {t('labels.followUpQuestion')}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                      {section.rows.map((row, idx) => (
                                        <tr key={`${row.developmentArea || 'row'}-${sectionIndex}-${idx}`}>
                                          <td className="px-6 py-5 text-sm text-gray-900 font-medium align-top">
                                            {idx === 0 && section.title && (
                                              <div className="mb-2">{section.title}</div>
                                            )}
                                            {row.developmentArea ? row.developmentArea : ''}
                                          </td>

                                          <td className="px-6 py-5 text-sm text-gray-700 align-top leading-relaxed">
                                            {row.interviewQuestion || '-'}
                                          </td>

                                          <td className="px-6 py-5 text-sm text-gray-600 align-top italic leading-relaxed space-y-2">
                                            {row.followUpQuestions?.length > 0
                                              ? row.followUpQuestions.map((question, qIndex) => (
                                                  <p key={`${question}-${qIndex}`}>{question}</p>
                                                ))
                                              : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                </table>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                              <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                  <td className="px-6 py-5 text-sm text-gray-700" colSpan={3}>-</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 space-y-3">
                          <h3 className="text-xl font-bold text-gray-900">{t('labels.whyTheseQuestions')}</h3>
                          {activeReport?.whyTheseQuestions
                            ? renderLines(activeReport.whyTheseQuestions)
                            : (
                              <p className="text-gray-700 leading-relaxed text-base">
                                Değerlendirme sürecinde kişinin ilişki dinamiklerinde aşırı temkinli davrandığı,
                                bu nedenle kararsızlık ve güven sorunu algısı yaratabildiği gözlemlenmiştir. Bu
                                soru seti, kişinin bu alanlardaki içgörüsünü ve gelişim pratiğini değerlendirmek
                                amacıyla seçilmiştir.
                              </p>
                            )}
                        </div>
                      </div>
                    )
                  )}

                  {competencySubTab === 'development-plan' && (
                    !hasCompetencyScore ? (
                      <div className="text-gray-700">-</div>
                    ) : activeReport?.developmentPlan ? (
                      normalizedDevelopmentPlanSections.length > 0 ? (
                        <div className="space-y-4">
                          {normalizedDevelopmentPlanSections.map((section, idx) => {
                            const sectionKey = `dev-plan-${idx + 1}`;
                            const normalizeItemTitle = (value: string) => value.replace(/^\uFEFF/, '').trim();
                            const isPlanTitle = (value: string) => {
                              const normalized = normalizeItemTitle(value).toLowerCase();
                              return normalized.startsWith('gelişim planı') || normalized.startsWith('gelisim plani');
                            };
                            const normalizePlanTitle = (value: string) =>
                              value.replace(/^(gelişim planı|gelisim plani)\b\s*[:\-–—]?\s*/i, '').trim();
                            const planTitleItem = section.items.find((item) => isPlanTitle(item.title));
                            const sectionTitle =
                              section.title ||
                              planTitleItem?.content?.[0]?.trim() ||
                              normalizePlanTitle(normalizeItemTitle(planTitleItem?.title || ''));
                            const filteredItems = section.items.filter((item) => !isPlanTitle(item.title));
                            return (
                              <div key={sectionKey} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <button
                                  className="btn btn-ghost w-full flex items-center justify-between p-5 text-left hover:bg-gray-50"
                                  onClick={() => toggleDevPlan(sectionKey)}
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      {sectionTitle && (
                                        <h4 className="font-bold text-gray-900">{sectionTitle}</h4>
                                      )}
                                    </div>
                                  </div>
                                  <i
                                    className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${
                                      openDevPlans[sectionKey] ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {openDevPlans[sectionKey] && (
                                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                                    <div className="border border-gray-200 rounded-2xl bg-gray-50/60 p-5 space-y-6">
                                      {(() => {
                                        const isPodcastCard = (value: string) => /podcast|okuma/i.test(value);
                                        const isTrainingCard = (value: string) => /eğitim|egitim/i.test(value);
                                        const isGoalCard = (value: string) => /hedef/i.test(value);
                                        const isPracticeCard = (value: string) => /uygulama/i.test(value);

                                        const podcastItems = filteredItems.filter((item) => isPodcastCard(item.title || ''));
                                        const goalItem = filteredItems.find((item) => isGoalCard(item.title || ''));
                                        const practiceItem = filteredItems.find((item) => isPracticeCard(item.title || ''));
                                        const middleItems = filteredItems.filter(
                                          (item) =>
                                            !isPodcastCard(item.title || '') &&
                                            !isGoalCard(item.title || '') &&
                                            !isPracticeCard(item.title || '')
                                        );

                                        const renderCard = (item: typeof filteredItems[number], itemIndex: number, opts?: { isPodcast?: boolean }) => {
                                          const title = item.title || '';
                                          const lowerTitle = title.toLowerCase();
                                          const shouldList = opts?.isPodcast || isTrainingCard(lowerTitle);
                                          return (
                                            <div
                                              key={`${sectionKey}-${item.title}-${itemIndex}`}
                                              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full flex flex-col"
                                            >
                                              {opts?.isPodcast ? (
                                                <>
                                                  {title && (
                                                    <h5 className="text-sm font-semibold text-gray-900 text-center mb-3">
                                                      {title}
                                                    </h5>
                                                  )}
                                                  <div className="flex-1">
                                                    {item.content.length > 0 ? (
                                                      <ul className="list-disc pl-4 space-y-2 text-sm text-gray-700 leading-relaxed">
                                                        {item.content.map((line, lineIndex) => (
                                                          <li key={`${sectionKey}-${itemIndex}-${lineIndex}`}>{line}</li>
                                                        ))}
                                                      </ul>
                                                    ) : (
                                                      <p className="text-sm text-gray-700 leading-relaxed">-</p>
                                                    )}
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  {title && (
                                                    <h5 className="text-sm font-semibold text-gray-900 text-center mb-3">
                                                      {title}
                                                    </h5>
                                                  )}
                                                  <div className="flex-1">
                                                    {item.content.length > 0 ? (
                                                      shouldList ? (
                                                        <ul className="list-disc pl-4 space-y-2 text-sm text-gray-700 leading-relaxed">
                                                          {item.content.map((line, lineIndex) => (
                                                            <li key={`${sectionKey}-${itemIndex}-${lineIndex}`}>{line}</li>
                                                          ))}
                                                        </ul>
                                                      ) : (
                                                        <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                                                          {item.content.map((line, lineIndex) => (
                                                            <p key={`${sectionKey}-${itemIndex}-${lineIndex}`}>{line}</p>
                                                          ))}
                                                        </div>
                                                      )
                                                    ) : (
                                                      <p className="text-sm text-gray-700 leading-relaxed">-</p>
                                                    )}
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          );
                                        };

                                        return (
                                          <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-6 items-stretch">
                                              {goalItem && (
                                                <div className="lg:row-span-2">
                                                  {renderCard(goalItem, 0)}
                                                </div>
                                              )}
                                              {middleItems.slice(0, 2).map((item, itemIndex) => (
                                                <div key={`${sectionKey}-middle-${itemIndex}`}>
                                                  {renderCard(item, itemIndex + 1)}
                                                </div>
                                              ))}
                                              {practiceItem && (
                                                <div className="lg:row-span-2">
                                                  {renderCard(practiceItem, 3)}
                                                </div>
                                              )}
                                              {podcastItems[0] && (
                                                <div className="lg:col-span-2">
                                                  {renderCard(podcastItems[0], 4, { isPodcast: true })}
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-3">
                          <h3 className="text-lg font-bold text-gray-900">{t('labels.developmentPlan')}</h3>
                          {renderLines(activeReport.developmentPlan)}
                        </div>
                      )
                    ) : (
                      <div className="text-gray-700">-</div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report-access' && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('labels.reportAccessTitle')}</h2>
                <p className="text-gray-600">{t('labels.reportAccessSubtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { title: t('labels.viewOnline'), desc: t('labels.viewOnlineDesc'), variant: 'primary', icon: 'fa-eye', iconColor: 'text-blue-600', action: handlePreviewPdf },
                  { title: t('labels.downloadReport'), desc: t('labels.downloadPdfDesc'), variant: 'secondary', icon: 'fa-download', iconColor: 'text-green-600', action: handleDownloadPdf },
                  { title: t('labels.shareReport'), desc: t('labels.shareReportDesc'), variant: 'secondary', icon: 'fa-share-nodes', iconColor: 'text-purple-600', action: handleSharePdf }
                ].map((card) => (
                  <button
                    key={card.title}
                    className={`btn btn-${card.variant} rounded-xl p-6 text-left transition-colors group disabled:opacity-60 disabled:cursor-not-allowed`}
                    style={{ height: 'auto', alignItems: 'flex-start' }}
                    onClick={card.action}
                    disabled={isPdfLoading || !latestUser}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <i className={`fa-solid ${card.icon} text-2xl ${card.iconColor || 'text-white'}`} />
                      </div>
                      <i className="fa-solid fa-arrow-right text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                    <p className="text-sm text-blue-100">{card.desc}</p>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('labels.reportInformationTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: t('labels.reportTypeLabel'), value: t('labels.reportTypeValue') },
                    { label: t('labels.assessmentPeriodLabel'), value: formatQuarterLabel(latestUser?.completionDate || latestUser?.sentDate) },
                    { label: t('labels.completionDate'), value: formatDateLong(latestUser?.completionDate) },
                    { label: t('labels.reportPagesLabel'), value: pdfPageCountLabel || '-' },
                    { label: t('labels.fileSizeLabel'), value: pdfSizeLabel || '-' },
                    { label: t('labels.lastModifiedLabel'), value: t('labels.lastModifiedValue') }
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                      <div className="text-gray-900 font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="fa-solid fa-info" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('labels.reportContentsTitle')}</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      {t('labels.reportContentsSubtitle')}
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {[
                        t('labels.reportContentItem1'),
                        t('labels.reportContentItem2'),
                        t('labels.reportContentItem3'),
                        t('labels.reportContentItem4'),
                        t('labels.reportContentItem5')
                      ].map((item) => (
                        <li key={item} className="flex items-center">
                          <i className="fa-solid fa-check text-blue-600 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">PDF Yükle</h3>
                    <p className="text-sm text-gray-500">
                      Rapor PDF’ini yükleyip sorularını sorabilirsin.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(event) => setAiFile(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {aiFileName && (
                    <div className="text-sm text-gray-700">
                      Yüklü dosya: <span className="font-semibold">{aiFileName}</span>
                    </div>
                  )}
                  {aiError && (
                    <div className="text-sm text-red-600">{aiError}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAiUpload}
                      disabled={isAiLoading || !aiFile}
                      className="btn btn-primary"
                    >
                      {isAiLoading ? 'Yükleniyor...' : 'Yükle'}
                    </button>
                    <button
                      onClick={handleAiReset}
                      disabled={isAiLoading}
                      className="btn btn-secondary"
                    >
                      Sıfırla
                    </button>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Örnek Komutlar</div>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setAiInput(item)}
                          className="btn btn-ghost"
                          style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[520px]">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="font-semibold text-gray-900">AI Asistan</div>
                    <div className="text-xs text-gray-500">
                      {aiSessionId ? 'Oturum aktif' : 'PDF yükleyin'}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {aiMessages.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        PDF yükledikten sonra sorularını yazabilirsin.
                      </div>
                    ) : (
                      aiMessages.map((msg, index) => (
                        <div
                          key={`${msg.role}-${index}`}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(event) => setAiInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleAiSend();
                          }
                        }}
                        placeholder="Sorunuzu yazın..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isAiLoading}
                      />
                      <button
                        onClick={handleAiSend}
                        disabled={isAiLoading || !aiInput.trim() || !aiSessionId}
                      className="btn btn-primary"
                      >
                        {isAiLoading ? '...' : 'Gönder'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-6 right-6 z-[70]">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
              toastType === 'success'
                ? 'bg-green-600'
                : toastType === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonResultsDetail;
