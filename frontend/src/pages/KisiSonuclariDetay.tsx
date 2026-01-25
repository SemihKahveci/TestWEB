import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

type DetailTab = 'executive-summary' | 'competency-details' | 'report-access' | 'ai-assistant';
type CompetencyKey = 'strategic-thinking' | 'leadership' | 'problem-solving' | 'overall-score';
type CompetencySubTab = 'general-evaluation' | 'strengths-development' | 'interview-questions' | 'development-plan';

const KisiSonuclariDetay: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<DetailTab>('executive-summary');
  const [activeCompetency, setActiveCompetency] = useState<CompetencyKey>('strategic-thinking');
  const [competencySubTab, setCompetencySubTab] = useState<CompetencySubTab>('general-evaluation');
  const [openDevPlans, setOpenDevPlans] = useState<Record<string, boolean>>({
    'dev-plan-1': false,
    'dev-plan-2': false,
    'dev-plan-3': false
  });

  const competencyOptions = useMemo(() => ([
    { value: 'strategic-thinking', label: 'Uyumluluk ve Dayanıklılık (9.2)' },
    { value: 'leadership', label: 'Müşteri Odaklılık (8.8)' },
    { value: 'problem-solving', label: 'İnsanları Etkileme (8.9)' },
    { value: 'overall-score', label: 'Güven Veren İşbirlikçi ve Sinerji (8.4)' }
  ]), []);

  useEffect(() => {
    setCompetencySubTab('general-evaluation');
    setOpenDevPlans({
      'dev-plan-1': false,
      'dev-plan-2': false,
      'dev-plan-3': false
    });
  }, [activeCompetency]);

  useEffect(() => {
    const state = location.state as { competency?: CompetencyKey } | null;
    if (state?.competency) {
      setActiveCompetency(state.competency);
      setActiveTab('competency-details');
    }
  }, [location.state]);

  const competencyCopy = useMemo(() => ({
    'strategic-thinking': {
      title: 'Uyumluluk ve Dayanıklılık',
      overviewTitle: 'Uyumluluk ve Dayanıklılık Hakkında',
      overviewText: 'Bu yetkinlik, uzun vadeli hedefleri belirleme, pazar trendlerini analiz etme ve organizasyonel vizyonla uyumlu kararlar alma becerisini ölçer.',
      strengths: ['Vizyoner bakış açısı', 'Veri odaklı karar alma', 'Sistemsel düşünme'],
      development: ['Kısa vadeli taktiksel uygulama', 'Senaryo planlama pratiği'],
      questions: [
        'Karmaşık bir stratejik kararı, verilerin yetersiz olduğu bir durumda nasıl aldığınızı anlatır mısınız?',
        'Uzun vadeli bir planın, değişen pazar koşulları nedeniyle başarısız olduğu bir örneği paylaşın.'
      ],
      plan: [
        { title: 'Sektör Trendlerini Takip', text: 'Aylık sektör raporlarını inceleyip ekip ile paylaşın.' },
        { title: 'Senaryo Planlaması', text: 'Gelecek çeyrek için en az 3 farklı senaryo analizi yapın.' }
      ]
    },
    leadership: {
      title: 'Müşteri Odaklılık',
      overviewTitle: 'Müşteri Odaklılık Hakkında',
      overviewText: 'Ekipleri yönlendirme, ilham verme ve değişimi yönetme kabiliyetini ölçer.',
      strengths: ['İlham veren iletişim', 'Güven inşası', 'Paydaş yönetimi'],
      development: ['Zor konuşmalar', 'Üst yönetim etkisi'],
      questions: [
        'Resmi otorite olmadan bir kararı nasıl etkilediniz?',
        'Değişime direnç gösteren bir ekibi nasıl yönettiniz?'
      ],
      plan: [
        { title: 'Mentorluk', text: 'Kıdemsiz ekip üyelerine mentorluk yapın.' },
        { title: 'Yönetici Sunumu', text: 'Üst yönetime düzenli sunumlar yapın.' }
      ]
    },
    'problem-solving': {
      title: 'İnsanları Etkileme',
      overviewTitle: 'İnsanları Etkileme Hakkında',
      overviewText: 'Karmaşık problemleri analiz etme, kök nedenleri bulma ve çözüm geliştirme becerisini ölçer.',
      strengths: ['Kök neden analizi', 'Yapısal yaklaşım', 'Yaratıcı çözümler'],
      development: ['Hız ve derinlik dengesi', 'Ekipli problem çözme'],
      questions: [
        'Açık çözümü olmayan bir problemde yaklaşımınızı anlatır mısınız?',
        'İlk çözümünüzün işe yaramadığı bir durumu paylaşın.'
      ],
      plan: [
        { title: 'Problem Çözme Atölyesi', text: 'Çeyreklik atölyeler düzenleyin.' },
        { title: 'Vaka Analizi', text: 'Örnek vakaları analiz edip paylaşın.' }
      ]
    },
    'overall-score': {
      title: 'Güven Veren İşbirlikçi ve Sinerji',
      overviewTitle: 'Güven Veren İşbirlikçi ve Sinerji Hakkında',
      overviewText: 'Bu yetkinlik, ekip içinde güven oluşturma, işbirliğini güçlendirme ve ortak hedeflere uyumu artırma becerisini temsil eder.',
      strengths: ['Güven inşa etme', 'Ortak hedeflere bağlılık', 'Ekip uyumu'],
      development: ['İletişimde tutarlılık', 'Karşılıklı geri bildirim kültürü'],
      questions: [
        'Ekip içinde güveni artırmak için hangi adımları atarsın?',
        'İşbirliğini zorlaştıran bir durumu nasıl ele aldığını paylaşır mısın?'
      ],
      plan: [
        { title: 'Güven Atölyeleri', text: 'Ekip içinde düzenli güven ve iletişim atölyeleri planla.' },
        { title: 'Geri Bildirim Ritmi', text: 'Aylık geri bildirim toplantılarıyla işbirliğini güçlendir.' }
      ]
    }
  }), []);

  const activeContent = competencyCopy[activeCompetency];
  const toggleDevPlan = (key: string) => {
    setOpenDevPlans((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-gray-50 font-inter min-h-screen">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <i className="fa-solid fa-arrow-left" />
              </button>
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <span className="hover:text-gray-700">Değerlendirmeler</span>
                  <span>/</span>
                  <span className="hover:text-gray-700">Kişi Sonuçları</span>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Sarah Johnson</span>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Rapor Detayları</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Kapsamlı Değerlendirme Raporu</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="fa-solid fa-download" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="fa-solid fa-share-nodes" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="fa-solid fa-print" />
              </button>
              <div className="h-8 w-px bg-gray-300" />
              <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                <img
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"
                  alt="User"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">Admin User</div>
                  <div className="text-xs text-gray-500">HR Manager</div>
                </div>
                <i className="fa-solid fa-chevron-down text-xs text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sarah Johnson</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <i className="fa-solid fa-briefcase mr-2 text-gray-400" />
                    <span>Senior Product Manager</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-calendar mr-2 text-gray-400" />
                    <span>Katılım: Ocak 2020</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Son Değerlendirme</div>
              <div className="text-lg font-semibold text-gray-900">Q4 2024 Review</div>
              <div className="text-sm text-gray-600">Tamamlandı: 15 Aralık 2024</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { key: 'strategic-thinking', title: 'Uyumluluk ve Dayanıklılık', score: '9.2', color: 'from-blue-500 to-blue-600', icon: 'fa-chart-line', badge: '+12%' },
              { key: 'leadership', title: 'Müşteri Odaklılık', score: '8.8', color: 'from-green-500 to-green-600', icon: 'fa-trophy', badge: 'Top 15%' },
              { key: 'problem-solving', title: 'İnsanları Etkileme', score: '8.9', color: 'from-purple-500 to-purple-600', icon: 'fa-star', badge: '8/12' },
              { key: 'overall-score', title: 'Güven Veren İşbirlikçi ve Sinerji', score: '8.4', color: 'from-orange-500 to-orange-600', icon: 'fa-arrow-trend-up', badge: '+0.7' }
            ].map((item) => {
              const isSelectable = true;
              const isActive = activeCompetency === item.key;
              return (
                <div
                  key={`${item.title}-${item.score}`}
                  className={`bg-gradient-to-br ${item.color} rounded-xl shadow-sm p-6 text-white transition-all ${
                    isSelectable ? 'cursor-pointer hover:shadow-md' : ''
                  } ${isActive ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-gray-50' : ''}`}
                  role={isSelectable ? 'button' : undefined}
                  tabIndex={isSelectable ? 0 : undefined}
                  onClick={() => {
                    if (isSelectable) {
                      setActiveCompetency(item.key as CompetencyKey);
                      setActiveTab('competency-details');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!isSelectable) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveCompetency(item.key as CompetencyKey);
                      setActiveTab('competency-details');
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <i className={`fa-solid ${item.icon} text-3xl opacity-80`} />
                    <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-xs font-medium">
                      {item.badge}
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">{item.score}</div>
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
                { key: 'executive-summary', label: 'Executive Summary', icon: 'fa-file-lines' },
                { key: 'competency-details', label: 'Competency Details', icon: 'fa-list-check' },
                { key: 'report-access', label: 'Report Access', icon: 'fa-file-pdf' },
                { key: 'ai-assistant', label: 'AI Assistant', icon: 'fa-robot' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
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
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Executive Summary</h2>
                <p className="text-gray-600">Q4 2024 değerlendirme sonuçlarının üst düzey özeti</p>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <i className="fa-solid fa-file-lines text-blue-600 mr-3" />
                  Genel Özet
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-gray-800 leading-relaxed mb-4">
                    Sarah Johnson, Q4 2024 değerlendirmesinde 8.4/10 genel skorla üstün performans sergilemiştir.
                    Şirket genelinde 92. yüzdelik dilimde yer almakta ve önceki değerlendirmelere göre anlamlı bir artış göstermektedir.
                  </p>
                  <p className="text-gray-800 leading-relaxed mb-4">
                    En güçlü alanları Strategic Thinking ve Problem Solving olarak öne çıkmaktadır. Pozisyon ve şirket benchmarklarının belirgin şekilde üzerindedir.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    Bu sonuçlar, yüksek liderlik potansiyeli ve güçlü stratejik bakış açısıyla desteklenmektedir.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fa-solid fa-circle-check text-green-600 mr-3" />
                    Güçlü Yönler
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Strategic Vision & Long-term Planning',
                        text: 'Günlük kararları uzun vadeli hedeflerle uyumlu biçimde yönlendirme kabiliyeti.'
                      },
                      {
                        title: 'Complex Problem Resolution',
                        text: 'Karmaşık problemlerde sistematik ve sonuç odaklı yaklaşım.'
                      },
                      {
                        title: 'Leadership Presence & Influence',
                        text: 'Ekipleri motive etme ve paydaşlar arasında güven inşa etme becerisi.'
                      }
                    ].map((item, idx) => (
                      <div key={item.title} className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <div className="flex items-start">
                          <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fa-solid fa-arrow-trend-up text-orange-600 mr-3" />
                    Gelişim Alanları
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Adaptability Under Pressure',
                        text: 'Hızlı değişen önceliklere uyum için yapılandırılmış yöntemler geliştirilmesi.'
                      },
                      {
                        title: 'Delegation & Team Empowerment',
                        text: 'Ekip içinde sorumluluk dağılımını artırarak yetkinlik geliştirme.'
                      },
                      {
                        title: 'Technical Depth in Emerging Areas',
                        text: 'Yeni teknolojilerde derinleşme ile stratejik yetkinliği güçlendirme.'
                      }
                    ].map((item, idx) => (
                      <div key={item.title} className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                        <div className="flex items-start">
                          <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competency-details' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Competency Details</h2>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Yetkinlik Seç:</label>
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
                      { key: 'general-evaluation', label: 'Genel Değerlendirme' },
                      { key: 'strengths-development', label: 'Güçlü Yönler & Gelişim Alanları' },
                      { key: 'interview-questions', label: 'Mülakat Soruları' },
                      { key: 'development-plan', label: 'Gelişim Planı' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        className={`flex-1 py-4 px-6 text-sm font-medium border-b-[3px] transition-all ${
                          competencySubTab === tab.key
                            ? 'border-blue-600 text-blue-600 bg-blue-50'
                            : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                        }`}
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
                      <p className="text-gray-800 leading-relaxed">{activeContent.overviewText}</p>
                    </div>
                  )}

                  {competencySubTab === 'strengths-development' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <div className="flex items-center space-x-2 mb-6">
                          <i className="fa-solid fa-circle-check text-green-600 text-lg" />
                          <h3 className="text-lg font-bold text-gray-900">Key Strengths</h3>
                        </div>
                        <div className="space-y-4">
                          {[
                            {
                              title: 'Strategic Vision & Long-term Planning',
                              text: 'Demonstrates exceptional ability to connect day-to-day decisions with organizational objectives. Shows clear understanding of market dynamics and competitive positioning.'
                            },
                            {
                              title: 'Complex Problem Resolution',
                              text: 'Excels at breaking down multifaceted challenges into manageable components. Consistently delivers innovative solutions that address root causes rather than symptoms.'
                            },
                            {
                              title: 'Leadership Presence & Influence',
                              text: 'Naturally inspires confidence and motivates team members. Effectively navigates organizational dynamics and builds consensus across stakeholder groups.'
                            }
                          ].map((item, index) => (
                            <div
                              key={item.title}
                              className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-6">
                          <i className="fa-solid fa-arrow-trend-up text-orange-500 text-lg" />
                          <h3 className="text-lg font-bold text-gray-900">Development Opportunities</h3>
                        </div>
                        <div className="space-y-4">
                          {[
                            {
                              title: 'Adaptability Under Pressure',
                              text: 'While generally flexible, there are opportunities to enhance responsiveness when priorities shift rapidly. Consider developing frameworks for managing ambiguity.'
                            },
                            {
                              title: 'Delegation & Team Empowerment',
                              text: 'Strong execution skills sometimes lead to taking on tasks that could develop team members. Focus on building team capability through strategic delegation.'
                            },
                            {
                              title: 'Technical Depth in Emerging Areas',
                              text: 'Maintain technical credibility by investing time in emerging technologies and industry-specific tools relevant to product management.'
                            }
                          ].map((item, index) => (
                            <div
                              key={item.title}
                              className="bg-orange-50 border border-orange-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {competencySubTab === 'interview-questions' && (
                    <div>
                      <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm mb-8">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/4 uppercase tracking-wider"
                              >
                                Gelişim Alanı
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/3 uppercase tracking-wider"
                              >
                                Mülakat Sorusu
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-4 text-left text-sm font-bold text-gray-900 w-1/3 uppercase tracking-wider"
                              >
                                Devam Sorusu
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-5 text-sm text-gray-900 font-medium align-top">
                                İlişkide Tutarlılık
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-700 align-top leading-relaxed">
                                Sosyal ilişkilerde, kendinizi yanlış anlaşıldığınız veya gerçek niyetinizin
                                sorgulandığı bir durumu paylaşır mısınız? Bu durum nasıl gelişti ve siz nasıl
                                bir tutum sergilediniz?
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-600 align-top italic leading-relaxed">
                                “Bu deneyimden ne öğrendiniz ve sonraki ilişkilerinizde bu öğrendiklerinizi
                                nasıl uyguladınız?”
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-5 text-sm text-gray-900 font-medium align-top">
                                Kriz Anında Proaktif Aksiyon Alma ve Güven Verme
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-700 align-top leading-relaxed">
                                “Olayın içinde bulunduğun sırada daha çok inisiyatif alabileceğini fark
                                ettiğin bir örnek var mı?”
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-600 align-top italic leading-relaxed space-y-2">
                                <p>“İlk anda neden beklemeyi tercih ettin?”</p>
                                <p>“Sonradan durumu nasıl yönlendirdin?”</p>
                                <p>“Bu davranışının ekibe nasıl yansıdığını düşünüyorsun?”</p>
                                <p>“Şimdi aynı duruma düşsen neyi farklı yapardın?”</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Neden Bu Sorular?</h3>
                        <p className="text-gray-700 leading-relaxed text-base">
                          Değerlendirme sürecinde kişinin ilişki dinamiklerinde aşırı temkinli davrandığı,
                          bu nedenle kararsızlık ve güven sorunu algısı yaratabildiği gözlemlenmiştir. Bu
                          soru seti, kişinin bu alanlardaki içgörüsünü ve gelişim pratiğini değerlendirmek
                          amacıyla seçilmiştir.
                        </p>
                      </div>
                    </div>
                  )}

                  {competencySubTab === 'development-plan' && (
                    <div className="space-y-4">
                      {[
                        {
                          key: 'dev-plan-1',
                          badgeColor: 'bg-blue-100 text-blue-600',
                          title: 'Müşteri Deneyimi Stratejisi Geliştirme',
                          subtitle: 'Stratejik düşünme yetkinliğini müşteri odaklılıkla birleştirme',
                          target:
                            'Önümüzdeki 2 ay içinde 3 farklı müşteri temas noktasını analiz ederek süreç geliştirme önerileri oluşturmak ve 1 müşteri segmenti için 6 aylık stratejik değer önerisi modelini yöneticinle paylaşmak.',
                          daily:
                            'Günlük Soru: “Bugün geliştirdiğim çözüm müşterinin genel deneyiminde nasıl bir fark yaratır?”',
                          trainings: [
                            'Müşteri Yolculuğu Haritalama Eğitimi (Service Design Tools, UXPressia)',
                            'Design Thinking Atölyesi (IDEO, Interaction Design Foundation)'
                          ],
                          podcasts: [
                            'Experience Matters - “How to See Your Brand from the Customer’s Eyes”',
                            'TEDx - “Designing for Simplicity” - John Maeda'
                          ],
                          practice: [
                            {
                              label: 'Aylık',
                              text: 'Her hafta müşteriyle ilgili “stratejik fırsat” başlığı altında 1 yeni fikir geliştir ve haftalık planına not et.'
                            },
                            {
                              label: 'Çeyrek Bazlı',
                              text: '1 müşteri segmenti için 6 aylık değer önerisi modelini mentorunla değerlendir ve gerekirse ekip içinde sun.'
                            }
                          ]
                        },
                        {
                          key: 'dev-plan-2',
                          badgeColor: 'bg-purple-100 text-purple-600',
                          title: 'Veri Odaklı Karar Alma Yetkinliği',
                          subtitle: 'Analitik yetenekleri karar süreçlerine entegre etme',
                          target:
                            '6 ay içinde en az 2 stratejik karar sürecinde veri analizi kullanarak sonuç raporları hazırlamak ve ekip toplantılarında sunmak.',
                          daily:
                            'Günlük Soru: “Bu kararı destekleyen veriler neler ve hangi metrikleri takip etmeliyim?”',
                          trainings: [
                            'Data Analytics for Business (Coursera)',
                            'Excel & Tableau İleri Seviye Eğitimi'
                          ],
                          podcasts: [
                            'Harvard Business Review - “The Power of Data-Driven Decision Making”',
                            'Podcast: Data Skeptic - Analytics in Practice'
                          ],
                          practice: [
                            { label: 'Haftalık', text: 'Bir karar noktası belirle ve hangi verilere ihtiyaç duyduğunu listele.' },
                            { label: 'Aylık', text: 'Bir veri setini analiz et ve bulgularını yöneticinle paylaş.' }
                          ]
                        },
                        {
                          key: 'dev-plan-3',
                          badgeColor: 'bg-green-100 text-green-600',
                          title: 'Paydaş Yönetimi ve İletişim',
                          subtitle: 'Farklı seviyelerdeki paydaşlarla etkili iletişim kurma',
                          target:
                            '3 ay içinde en az 5 farklı paydaş grubuyla düzenli iletişim kanalları kurmak ve aylık geri bildirim toplantıları düzenlemek.',
                          daily:
                            'Günlük Soru: “Bu konuda kimlerin görüşünü almalıyım ve onlara nasıl ulaşabilirim?”',
                          trainings: [
                            'Stakeholder Management Workshop',
                            'Etkili İletişim ve Sunum Becerileri Eğitimi'
                          ],
                          podcasts: [
                            '“Crucial Conversations” - Kerry Patterson',
                            'TED Talk - “How to Speak So That People Want to Listen”'
                          ],
                          practice: [
                            { label: 'Haftalık', text: 'Her hafta en az 2 paydaşla görüşme planla ve notlarını tut.' },
                            { label: 'Aylık', text: 'Paydaş haritası oluştur ve iletişim stratejini gözden geçir.' }
                          ]
                        }
                      ].map((plan, idx) => (
                        <div key={plan.key} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <button
                            className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left"
                            onClick={() => toggleDevPlan(plan.key)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`${plan.badgeColor} w-10 h-10 rounded-lg flex items-center justify-center font-bold`}>
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{plan.title}</h4>
                                <p className="text-sm text-gray-500">{plan.subtitle}</p>
                              </div>
                            </div>
                            <i
                              className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${
                                openDevPlans[plan.key] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {openDevPlans[plan.key] && (
                            <div className="border-t border-gray-200 bg-gray-50 p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
                                  <h5 className="text-base font-bold text-gray-900 mb-4 text-center">Hedef (SMART KPI)</h5>
                                  <div className="flex-grow flex items-center">
                                    <p className="text-sm text-gray-700 leading-relaxed text-center">{plan.target}</p>
                                  </div>
                                </div>

                                <div className="lg:col-span-6 flex flex-col gap-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
                                      <h5 className="text-base font-bold text-gray-900 mb-4 text-center">Günlük İşlerde Kullanım</h5>
                                      <p className="text-sm text-gray-700 leading-relaxed text-center">{plan.daily}</p>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
                                      <h5 className="text-base font-bold text-gray-900 mb-4 text-center">Eğitim Önerileri</h5>
                                      <ul className="text-sm text-gray-700 space-y-3">
                                        {plan.trainings.map((item) => (
                                          <li key={item} className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex-grow">
                                    <div className="flex flex-col h-full justify-between">
                                      <ul className="text-sm text-gray-700 space-y-3 mb-4">
                                        {plan.podcasts.map((item) => (
                                          <li key={item} className="flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      <h5 className="text-base font-bold text-gray-900 text-center mt-2">Podcast/Okuma Önerileri</h5>
                                    </div>
                                  </div>
                                </div>

                                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
                                  <h5 className="text-base font-bold text-gray-900 mb-4 text-center">Uygulama</h5>
                                  <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                                    {plan.practice.map((item) => (
                                      <p key={item.label}>
                                        <span className="font-semibold underline decoration-dotted">{item.label}:</span>{' '}
                                        {item.text}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report-access' && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Full Report Access</h2>
                <p className="text-gray-600">Tam raporu görüntüleyin, indirin veya paylaşın</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { title: 'View Online', desc: 'Raporu tarayıcıda görüntüle', color: 'bg-blue-600 hover:bg-blue-700', icon: 'fa-eye' },
                  { title: 'Download PDF', desc: 'Cihazınıza indirin', color: 'bg-green-600 hover:bg-green-700', icon: 'fa-download' },
                  { title: 'Share Report', desc: 'Paydaşlarla paylaşın', color: 'bg-purple-600 hover:bg-purple-700', icon: 'fa-share-nodes' }
                ].map((card) => (
                  <button key={card.title} className={`${card.color} text-white rounded-xl p-6 text-left transition-colors group`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <i className={`fa-solid ${card.icon} text-2xl`} />
                      </div>
                      <i className="fa-solid fa-arrow-right text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                    <p className="text-sm text-blue-100">{card.desc}</p>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Report Type', value: 'Comprehensive Assessment' },
                    { label: 'Assessment Period', value: 'Q4 2024' },
                    { label: 'Completion Date', value: 'December 15, 2024' },
                    { label: 'Report Pages', value: '24 pages' },
                    { label: 'File Size', value: '2.4 MB' },
                    { label: 'Last Modified', value: 'December 16, 2024' }
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
                    <h4 className="font-semibold text-gray-900 mb-2">Report Contents</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Rapor, 12 yetkinliğin detaylı analizini, benchmark karşılaştırmalarını ve gelişim önerilerini içerir.
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {[
                        'Executive summary and key findings',
                        'Detailed competency breakdowns',
                        'Interview questions and talking points',
                        'Personalized development plans',
                        'Historical performance trends'
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
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-robot text-white text-4xl" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Assistant Coming Soon</h2>
                <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                  Assessment sonuçlarına özel içgörüler ve öneriler yakında eklenecek.
                </p>
                <span className="inline-flex items-center px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-medium">
                  <i className="fa-solid fa-sparkles mr-2" />
                  Geliştirme Aşamasında
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KisiSonuclariDetay;
