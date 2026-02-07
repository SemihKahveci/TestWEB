import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../contexts/LanguageContext';
import { creditAPI, organizationAPI } from '../services/api';
import { safeLog } from '../utils/logger';

interface Planet {
  value: string;
  label: string;
}

interface Group {
  _id: string;
  name: string;
  status: string;
  organizations: string[];
  persons: string[];
  planets: string[];
  createdAt: string;
  updatedAt: string;
}

interface Person {
  name: string;
  email: string;
  title: string;
  groupName: string;
  planets: string[];
}

interface BulkPerson {
  name: string;
  email: string;
  personType: string;
  unvan: string;
  pozisyon: string;
  departman: string;
  planets: string[];
}

interface OrganizationItem {
  _id: string;
  grupLiderligi?: string;
  unvan?: string;
  pozisyon?: string;
}

const GameSendPage: React.FC = () => {
  const { language, t } = useLanguage();
  // State management
  const [activeTab, setActiveTab] = useState<'person' | 'group' | 'title' | 'bulk'>('person');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSuperAdminChecked, setIsSuperAdminChecked] = useState(false); // Super admin kontrolü tamamlandı mı?
  
  // Person tab states
  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [personType, setPersonType] = useState('');
  const [personDepartment, setPersonDepartment] = useState('');
  const [personTitle, setPersonTitle] = useState('');
  const [personPosition, setPersonPosition] = useState('');
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [isOrgLoading, setIsOrgLoading] = useState(false);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [showPlanetDropdown, setShowPlanetDropdown] = useState(false);
  const [planetSearchTerm, setPlanetSearchTerm] = useState('');

  // Bulk (Excel) tab states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState<BulkPerson[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkFileMeta, setBulkFileMeta] = useState<{ name: string; sizeLabel: string; rowCount: number } | null>(null);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isBulkDragging, setIsBulkDragging] = useState(false);
  
  // Group tab states
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [debouncedGroupSearchTerm, setDebouncedGroupSearchTerm] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  
  // Title tab states
  const [titles, setTitles] = useState<any[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [titleSearchTerm, setTitleSearchTerm] = useState('');
  const [debouncedTitleSearchTerm, setDebouncedTitleSearchTerm] = useState('');
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [selectedTitlePlanets, setSelectedTitlePlanets] = useState<string[]>([]);
  const [showTitlePlanetDropdown, setShowTitlePlanetDropdown] = useState(false);
  const [titlePlanetSearchTerm, setTitlePlanetSearchTerm] = useState('');
  
  // Modal states
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<Group | null>(null);
  const [showTitleDetailsModal, setShowTitleDetailsModal] = useState(false);
  const [selectedTitleDetails, setSelectedTitleDetails] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    failedPersons: [] as string[]
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    title: '',
    message: '',
    callback: null as ((result: boolean) => void) | null
  });
  const [isMobile, setIsMobile] = useState(false);

  const formatTemplate = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      template
    );

  const formatConfirmSend = (count: number) =>
    formatTemplate(t('labels.confirmSend'), { count });

  const formatInsufficientCredits = (remaining: number, needed: number) =>
    formatTemplate(t('errors.insufficientCredits'), { remaining, needed });

  const formatCodeSent = (creditCost: number) =>
    formatTemplate(t('messages.codeSent'), { creditCost });

  const formatCreditDeductionFailed = (message: string) =>
    formatTemplate(t('errors.creditDeductionFailed'), { message });

  const formatSendFailed = (message: string) =>
    formatTemplate(t('errors.sendFailed'), { message });

  const formatSendErrorGeneric = () => t('errors.sendFailedGeneric');

  const formatCreditSuccess = (successCount: number, totalCreditCost: number, superAdmin: boolean) =>
    superAdmin
      ? formatTemplate(t('messages.sendSuccessNoCredit'), { count: successCount })
      : formatTemplate(t('messages.sendSuccessWithCredit'), { count: successCount, creditCost: totalCreditCost });

  const formatPartialSuccess = (successCount: number, errorCount: number, totalCreditCost: number, superAdmin: boolean) =>
    superAdmin
      ? formatTemplate(t('messages.sendPartialNoCredit'), { successCount, errorCount })
      : formatTemplate(t('messages.sendPartialWithCredit'), { successCount, errorCount, creditCost: totalCreditCost });

  const formatNoOneSent = () => t('messages.sendNoRecipients');

  const formatPersonError = (name: string, message: string) =>
    `${name}: ${message}`;

  const formatSendErrorLabel = () => t('labels.sendError');

  const formatCodeGenerationFailed = () => t('errors.codeGenerationFailed');

  const formatCodeGenerateMissing = () => t('errors.codeGenerateMissing');

  const formatServerError = (status: number) =>
    formatTemplate(`${t('errors.serverError')} ({status})`, { status });

  const formatNoSearchResults = (query: string) =>
    formatTemplate(t('labels.noSearchResults'), { query });

  // Available planets
  const availablePlanets: Planet[] = [
    { value: 'venus', label: `${t('labels.planetVenus')} (${t('competency.uncertainty')} - ${t('competency.customerFocus')})` },
    { value: 'titan', label: `${t('labels.planetTitan')} (${t('competency.ie')} - ${t('competency.idik')})` }
  ];

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Responsive kontrolü
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const checkIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };
    
    checkIsMobile();
    mediaQuery.addEventListener('change', checkIsMobile);
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', checkIsMobile);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Load groups when group tab is selected
  useEffect(() => {
    if (activeTab === 'group' && groups.length === 0) {
      loadGroups();
    }
  }, [activeTab, groups.length]);

  // Load titles when title tab is selected
  useEffect(() => {
    if (activeTab === 'title' && titles.length === 0) {
      loadTitles();
    }
  }, [activeTab, titles.length]);

  // Load organizations for person/bulk tab comboboxes
  useEffect(() => {
    if ((activeTab === 'person' || activeTab === 'bulk') && organizations.length === 0) {
      loadOrganizations();
    }
  }, [activeTab, organizations.length]);

  // Debounce group search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupSearchTerm(groupSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [groupSearchTerm]);

  // Debounce title search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitleSearchTerm(titleSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [titleSearchTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('[data-dropdown]');
      
      if (!dropdown) {
        setShowGroupDropdown(false);
        setShowTitleDropdown(false);
        setShowPlanetDropdown(false);
        setShowTitlePlanetDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Super admin kontrolü
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check-superadmin', {
          credentials: 'include'
        });
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Super admin kontrolü hatası:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsSuperAdminChecked(true); // Kontrol tamamlandı
      }
    };
    checkSuperAdmin();
  }, []);

  // Load remaining credits on component mount (super admin değilse)
  useEffect(() => {
    // Super admin kontrolü tamamlanana kadar bekle
    if (!isSuperAdminChecked) return;
    if (!isSuperAdmin) {
      loadRemainingCredits();
    }
  }, [isSuperAdmin, isSuperAdminChecked]);

  // Sayfa focus olduğunda kredi bilgilerini yenile (super admin değilse)
  useEffect(() => {
    // Super admin kontrolü tamamlanana kadar bekle
    if (!isSuperAdminChecked) return;
    if (isSuperAdmin) return; // Super admin için kredi bilgisi yüklenmez
    
    const handleFocus = () => {
      loadRemainingCredits(true); // Force refresh
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isSuperAdmin, isSuperAdminChecked]);

  const loadRemainingCredits = async (forceRefresh = false) => {
    // Super admin için kredi bilgisi yüklenmez
    if (isSuperAdmin) {
      setRemainingCredits(0);
      return;
    }
    
    try {
      // Credit API'den güncel veri al
      // Cache'i bypass etmek için timestamp parametresi ekle
      const url = forceRefresh ? `/api/credit?t=${Date.now()}` : '/api/credit';
      const creditResponse = await fetch(url, {
        credentials: 'include'
      });
      
      if (creditResponse.ok) {
        const data = await creditResponse.json();
        if (data.success) {
          const { totalCredits, usedCredits, remainingCredits } = data.credit;
          setRemainingCredits(remainingCredits);
          
          // localStorage'ı da güncelle
          localStorage.setItem('remainingCredits', remainingCredits.toString());
          localStorage.setItem('usedCredits', usedCredits.toString());
          localStorage.setItem('totalCredits', totalCredits.toString());
          
          // Production'da kredi bilgileri loglanmaz (güvenlik)
          safeLog('debug', 'Kredi bilgileri güncellendi', { totalCredits, usedCredits, remainingCredits });
        } else {
          setRemainingCredits(0);
        }
      } else {
        // Super admin için companyId eksik olabilir, localStorage'ı temizle
        if (creditResponse.status === 400) {
          const errorData = await creditResponse.json().catch(() => ({}));
          if (errorData.message && errorData.message.includes('Super admin')) {
            // Super admin için companyId gerekiyor, localStorage'ı temizle
            localStorage.removeItem('remainingCredits');
            localStorage.removeItem('usedCredits');
            localStorage.removeItem('totalCredits');
            setRemainingCredits(0);
            return;
          }
        }
        throw new Error('API yanıtı başarısız');
      }
    } catch (error) {
      safeLog('error', 'Kredi bilgisi yüklenirken hata', error);
      
      // Super admin için companyId eksikse localStorage'ı temizle
      // Normal admin için fallback: localStorage'dan al
      const fallbackRemaining = parseInt(localStorage.getItem('remainingCredits') || '0');
      const fallbackUsed = parseInt(localStorage.getItem('usedCredits') || '0');
      const fallbackTotal = parseInt(localStorage.getItem('totalCredits') || '0');
      
      // Eğer hata mesajı super admin ile ilgiliyse, localStorage'ı temizle
      if (error instanceof Error && error.message.includes('Super admin')) {
        localStorage.removeItem('remainingCredits');
        localStorage.removeItem('usedCredits');
        localStorage.removeItem('totalCredits');
        setRemainingCredits(0);
        return;
      }
      
      // Normal admin için fallback kullan
      if (fallbackTotal > 0) {
        setRemainingCredits(fallbackRemaining);
      } else {
        setRemainingCredits(0);
      }
    }
  };

  // Load groups from API
  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/group', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(t('errors.groupListLoad'));
      }

      const result = await response.json();
      if (result.success) {
        // Only show active groups and sort alphabetically
        const activeGroups = result.groups
          .filter((group: Group) => group.status === 'Aktif')
          .sort((a: Group, b: Group) => a.name.localeCompare(b.name, 'tr-TR'));
        setGroups(activeGroups);
      } else {
        throw new Error(result.message || t('errors.groupListFetch'));
      }
    } catch (error) {
      safeLog('error', 'Grup listesi yükleme hatası', error);
      showMessage(t('labels.error'), t('errors.groupListLoad'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load titles from API
  const loadTitles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organization', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(t('errors.titleListLoad'));
      }

      const result = await response.json();
      if (result.success) {
        // Get unique titles and sort alphabetically
        const uniqueTitles = [...new Set(result.organizations.map((org: any) => org.unvan).filter((unvan: any) => unvan && unvan !== '-'))]
          .sort((a: any, b: any) => a.localeCompare(b, 'tr-TR'))
          .map((unvan: any) => ({
            _id: unvan,
            name: unvan,
            organizations: result.organizations.filter((org: any) => org.unvan === unvan)
          }));
        setTitles(uniqueTitles);
      } else {
        throw new Error(result.message || t('errors.titleListFetch'));
      }
    } catch (error) {
      safeLog('error', 'Unvan listesi yükleme hatası', error);
      showMessage(t('labels.error'), t('errors.titleListLoad'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab switching
  const switchTab = (tabName: 'person' | 'group' | 'title' | 'bulk') => {
    setActiveTab(tabName);
  };

  // Planet management (removed old addPlanet function)

  const removePlanet = (planetValue: string) => {
    setSelectedPlanets(selectedPlanets.filter(p => p !== planetValue));
  };

  // Group management
  const addGroup = (groupId: string) => {
    if (!groupId) {
      showMessage(t('labels.error'), t('errors.selectGroup'), 'error');
      return;
    }

    if (selectedGroups.includes(groupId)) {
      showMessage(t('labels.error'), t('errors.groupAlreadySelected'), 'error');
      return;
    }

    setSelectedGroups([...selectedGroups, groupId]);
    setGroupSearchTerm('');
    setShowGroupDropdown(false);
  };

  const removeGroup = (groupId: string) => {
    setSelectedGroups(selectedGroups.filter(g => g !== groupId));
  };

  // Title management
  const addTitle = (titleId: string) => {
    if (!titleId) {
      showMessage(t('labels.error'), t('errors.selectTitle'), 'error');
      return;
    }

    if (selectedTitles.includes(titleId)) {
      showMessage(t('labels.error'), t('errors.titleAlreadySelected'), 'error');
      return;
    }

    setSelectedTitles([...selectedTitles, titleId]);
    setTitleSearchTerm('');
    setShowTitleDropdown(false);
  };

  const removeTitle = (titleId: string) => {
    setSelectedTitles(selectedTitles.filter(t => t !== titleId));
  };

  const addPlanet = (planetValue: string) => {
    if (selectedPlanets.includes(planetValue)) {
      showMessage(t('labels.error'), t('errors.planetAlreadySelected'), 'error');
      return;
    }
    setSelectedPlanets([...selectedPlanets, planetValue]);
    setPlanetSearchTerm('');
    setShowPlanetDropdown(false);
  };

  // Title planet management (removed old addTitlePlanet function)

  const removeTitlePlanet = (planetValue: string) => {
    setSelectedTitlePlanets(selectedTitlePlanets.filter(p => p !== planetValue));
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => {
    // Türkçe karakterleri normalize et
    const normalizeText = (text: string) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i') // I'yi i'ye çevir
        .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/ş/g, 's') // Ş'yi s'ye çevir
        .replace(/ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/İ/g, 'i') // İ'yi i'ye çevir
        .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/Ş/g, 's') // Ş'yi s'ye çevir
        .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/Ç/g, 'c'); // Ç'yi c'ye çevir
    };
    
    const searchNormalized = normalizeText(debouncedGroupSearchTerm);
    const groupNameNormalized = normalizeText(group.name);
    
    return groupNameNormalized.includes(searchNormalized);
  });

  // Filter titles based on search term
  const filteredTitles = titles.filter(title => {
    // Türkçe karakterleri normalize et
    const normalizeText = (text: string) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i') // I'yi i'ye çevir
        .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/ş/g, 's') // Ş'yi s'ye çevir
        .replace(/ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/İ/g, 'i') // İ'yi i'ye çevir
        .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/Ş/g, 's') // Ş'yi s'ye çevir
        .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/Ç/g, 'c'); // Ç'yi c'ye çevir
    };
    
    const searchNormalized = normalizeText(debouncedTitleSearchTerm);
    const titleNameNormalized = normalizeText(title.name);
    
    return titleNameNormalized.includes(searchNormalized);
  });

  // Filter planets based on search term
  const filteredPlanets = availablePlanets.filter(planet => {
    // Türkçe karakterleri normalize et
    const normalizeText = (text: string) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i') // I'yi i'ye çevir
        .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/ş/g, 's') // Ş'yi s'ye çevir
        .replace(/ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/İ/g, 'i') // İ'yi i'ye çevir
        .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/Ş/g, 's') // Ş'yi s'ye çevir
        .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/Ç/g, 'c'); // Ç'yi c'ye çevir
    };
    
    const searchNormalized = normalizeText(planetSearchTerm);
    const planetLabelNormalized = normalizeText(planet.label);
    
    return planetLabelNormalized.includes(searchNormalized);
  });

  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    // Türkçe karakterleri normalize et
    const normalizeText = (text: string) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i') // I'yi i'ye çevir
        .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/ş/g, 's') // Ş'yi s'ye çevir
        .replace(/ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/ç/g, 'c') // Ç'yi c'ye çevir
        .replace(/İ/g, 'i') // İ'yi i'ye çevir
        .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
        .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
        .replace(/Ş/g, 's') // Ş'yi s'ye çevir
        .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
        .replace(/Ç/g, 'c'); // Ç'yi c'ye çevir
    };
    
    const normalizedText = normalizeText(text);
    const normalizedSearchTerm = normalizeText(searchTerm);
    
    // Normalize edilmiş metinde arama yap
    const searchIndex = normalizedText.indexOf(normalizedSearchTerm);
    if (searchIndex === -1) return text;
    
    // Orijinal metinde eşleşen kısmı bul
    const beforeMatch = text.substring(0, searchIndex);
    const matchLength = searchTerm.length;
    const match = text.substring(searchIndex, searchIndex + matchLength);
    const afterMatch = text.substring(searchIndex + matchLength);
    
    return (
      <>
        {beforeMatch}
        <span style={{ 
          backgroundColor: '#FEF3C7', 
          color: '#92400E',
          fontWeight: 600,
          padding: '1px 2px',
          borderRadius: '2px'
        }}>
          {match}
        </span>
        {afterMatch}
      </>
    );
  };

  // Show group details
  const showGroupDetails = async (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    if (group) {
      try {
        // Bu gruptaki kişilerin detaylarını al
        const response = await fetch('/api/authorization', {
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Grup kişilerinin detaylarını bul
            const groupPersons: any[] = [];
            // group.persons'un array olduğundan emin ol
            const personsArray = Array.isArray(group.persons) ? group.persons : [];
            for (const personValue of personsArray) {
              // personValue'nun string olduğundan emin ol
              const personValueStr = typeof personValue === 'string' ? personValue : String(personValue || '');
              const personName = personValueStr.includes(':') ? personValueStr.split(':')[1] : personValueStr;
              const personDetail = result.authorizations.find((p: any) => p.personName === personName);
              
              if (personDetail) {
                groupPersons.push({
                  name: personDetail.personName,
                  email: personDetail.email,
                  title: personDetail.title,
                  sicilNo: personDetail.sicilNo
                });
              }
            }

            // Group details'e kişi bilgilerini ekle
            // planets ve organizations array'lerinin de güvenli olduğundan emin ol
            const planetsArray = Array.isArray(group.planets) 
              ? group.planets.filter(p => p != null) 
              : [];
            const organizationsArray = Array.isArray(group.organizations) 
              ? group.organizations.filter(o => o != null) 
              : [];
            const groupWithPersons = {
              ...group,
              persons: groupPersons,
              planets: planetsArray,
              organizations: organizationsArray
            };

            setSelectedGroupDetails(groupWithPersons);
            setShowGroupDetailsModal(true);
          }
        }
      } catch (error) {
        safeLog('error', 'Grup detayları yükleme hatası', error);
        showMessage(t('labels.error'), t('errors.groupDetailsLoad'), 'error');
      }
    }
  };

  // Show title details
  const showTitleDetails = async (titleId: string) => {
    const title = titles.find(t => t._id === titleId);
    if (title) {
      try {
        // Bu unvanın pozisyonlarında çalışan kişileri bul
        const response = await fetch('/api/authorization', {
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Bu unvanın pozisyonlarını al
            const orgPositions = title.organizations
              .map((org: any) => org.pozisyon)
              .filter(Boolean)
              .filter((position: string, index: number, arr: string[]) => arr.indexOf(position) === index);

            // Bu pozisyonlardaki kişileri bul
            const matchingPersons = result.authorizations.filter((person: any) => 
              orgPositions.includes(person.title)
            );

            // Title details'e kişi bilgilerini ekle
            const titleWithPersons = {
              ...title,
              persons: matchingPersons.map(person => ({
                name: person.personName,
                email: person.email,
                title: person.title,
                sicilNo: person.sicilNo
              }))
            };

            setSelectedTitleDetails(titleWithPersons);
            setShowTitleDetailsModal(true);
          }
        }
      } catch (error) {
        safeLog('error', 'Unvan detayları yükleme hatası', error);
        showMessage(t('labels.error'), t('errors.titleDetailsLoad'), 'error');
      }
    }
  };

  const loadOrganizations = async () => {
    try {
      setIsOrgLoading(true);
      const response = await organizationAPI.getAll();
      if (response.data?.success) {
        setOrganizations(response.data.organizations || []);
      } else {
        showMessage(t('labels.error'), t('errors.organizationListFetch'), 'error');
      }
    } catch (error) {
      safeLog('error', 'Organizasyon listesi yükleme hatası', error);
      showMessage(t('labels.error'), t('errors.organizationLoadFailed'), 'error');
    } finally {
      setIsOrgLoading(false);
    }
  };

  const getUniqueOptions = (values: Array<string | undefined>) => {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
      const trimmed = (value || '').trim();
      if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '–') return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(trimmed);
    });
    return result;
  };

  const availableDepartments = getUniqueOptions(organizations.map(org => org.grupLiderligi));
  const availableTitles = getUniqueOptions(
    organizations
      .filter(org => !personDepartment || org.grupLiderligi === personDepartment)
      .map(org => org.unvan)
  );
  const availablePositions = getUniqueOptions(
    organizations
      .filter(org =>
        (!personDepartment || org.grupLiderligi === personDepartment) &&
        (!personTitle || org.unvan === personTitle)
      )
      .map(org => org.pozisyon)
  );

  const normalizeText = (value: string) =>
    value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/i̇/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, ' ');

  const parsePersonType = (value: string) => {
    const normalized = normalizeText(value);
    if (normalized.includes('aday') || normalized.includes('candidate')) return 'Aday';
    if (normalized.includes('calisan') || normalized.includes('employee')) return 'Çalışan';
    return '';
  };

  const parsePlanets = (value: string) => {
    const tokens = value
      .split(/[,;|/]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const result: string[] = [];
    tokens.forEach((token) => {
      const normalized = normalizeText(token);
      if (normalized === '0' || normalized.includes('venus') || normalized.includes('venis') || normalized.includes('venus')) {
        result.push('venus');
        return;
      }
      if (normalized === '1' || normalized.includes('titan')) {
        result.push('titan');
        return;
      }
    });

    return Array.from(new Set(result));
  };

  const parseExcelFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as Array<Array<any>>;

    if (!rows.length) {
      return { validRows: [] as BulkPerson[], errors: [t('errors.invalidExcelFormat')] };
    }

    const header = rows[0].map((cell) => normalizeText(String(cell || '')));
    const findIndex = (keys: string[]) => header.findIndex((item) => keys.some((key) => item.includes(key)));

    const idxEmail = findIndex(['email', 'e-posta', 'eposta', 'mail']);
    const idxName = findIndex(['adsoyad', 'ad soyad', 'isim', 'ad']);
    const idxType = findIndex(['kisitipi', 'kisi tipi', 'kisitypi', 'kisitype', 'kisitip', 'persontype', 'person type']);
    const idxTitle = findIndex(['unvan', 'title']);
    const idxPosition = findIndex(['pozisyon', 'position']);
    const idxDepartment = findIndex(['departman', 'department']);
    const idxPlanets = findIndex(['gezegen', 'gezegenler', 'planet', 'planets']);

    const errors: string[] = [];
    const validRows: BulkPerson[] = [];

    const departmentSet = new Set(availableDepartments.map((item) => normalizeText(item)));
    const titleSet = new Set(getUniqueOptions(organizations.map(org => org.unvan)).map((item) => normalizeText(item)));
    const positionSet = new Set(getUniqueOptions(organizations.map(org => org.pozisyon)).map((item) => normalizeText(item)));

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.every((cell) => !cell || String(cell).trim() === '')) {
        continue;
      }

      const rowNumber = i + 1;
      const email = idxEmail >= 0 ? String(row[idxEmail] || '').trim() : '';
      const name = idxName >= 0 ? String(row[idxName] || '').trim() : '';
      const personTypeRaw = idxType >= 0 ? String(row[idxType] || '').trim() : '';
      const unvan = idxTitle >= 0 ? String(row[idxTitle] || '').trim() : '';
      const pozisyon = idxPosition >= 0 ? String(row[idxPosition] || '').trim() : '';
      const departman = idxDepartment >= 0 ? String(row[idxDepartment] || '').trim() : '';
      const planetsRaw = idxPlanets >= 0 ? String(row[idxPlanets] || '').trim() : '';

      if (!email || !name || !personTypeRaw || !unvan || !pozisyon || !departman || !planetsRaw) {
        const missingFields: string[] = [];
        if (!email) missingFields.push('Email');
        if (!name) missingFields.push('Ad Soyad');
        if (!personTypeRaw) missingFields.push('Kişi Tipi');
        if (!unvan) missingFields.push('Unvan');
        if (!pozisyon) missingFields.push('Pozisyon');
        if (!departman) missingFields.push('Departman');
        if (!planetsRaw) missingFields.push('Gezegen');
        errors.push(`Satır ${rowNumber}: Zorunlu alanlar eksik. (${missingFields.join(', ')})`);
        continue;
      }

      const personTypeValue = parsePersonType(personTypeRaw);
      if (!personTypeValue) {
        errors.push(`Satır ${rowNumber}: Kişi tipi sadece Aday veya Çalışan olmalıdır.`);
        continue;
      }

      if (departmentSet.size > 0 && !departmentSet.has(normalizeText(departman))) {
        errors.push(`Satır ${rowNumber}: Departman bulunamadı.`);
        continue;
      }

      if (titleSet.size > 0 && !titleSet.has(normalizeText(unvan))) {
        errors.push(`Satır ${rowNumber}: Unvan bulunamadı.`);
        continue;
      }

      if (positionSet.size > 0 && !positionSet.has(normalizeText(pozisyon))) {
        errors.push(`Satır ${rowNumber}: Pozisyon bulunamadı.`);
        continue;
      }

      const planets = parsePlanets(planetsRaw);
      if (planets.length === 0) {
        errors.push(`Satır ${rowNumber}: Gezegen bilgisi geçersiz.`);
        continue;
      }

      validRows.push({
        name,
        email,
        personType: personTypeValue,
        unvan,
        pozisyon,
        departman,
        planets
      });
    }

    return { validRows, errors };
  };

  const handleBulkFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showMessage(t('labels.error'), t('errors.onlyExcelAllowed'), 'error');
      return;
    }

    setBulkFile(file);
    setBulkErrors([]);
    try {
      const { validRows, errors } = await parseExcelFile(file);
      setBulkRows(validRows);
      setBulkErrors(errors);
      const sizeKB = Math.round(file.size / 1024);
      setBulkFileMeta({
        name: file.name,
        sizeLabel: `${sizeKB} KB`,
        rowCount: validRows.length
      });
    } catch (error) {
      safeLog('error', 'Excel parse hatası', error);
      showMessage(t('labels.error'), t('errors.invalidExcelFormat'), 'error');
      setBulkRows([]);
    }
  };

  const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleBulkFileSelect(file);
  };

  const removeBulkFile = () => {
    setBulkFile(null);
    setBulkRows([]);
    setBulkErrors([]);
    setBulkFileMeta(null);
    const input = document.getElementById('bulkExcelInput') as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
  };

  const handleBulkDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsBulkDragging(false);
    const file = event.dataTransfer.files[0];
    handleBulkFileSelect(file || null);
  };

  const downloadBulkTemplate = () => {
    const headers = ['Email', 'Ad Soyad', 'Kişi Tipi', 'Unvan', 'Pozisyon', 'Departman', 'Gezegenler'];
    const exampleRow = ['ornek@email.com', 'Ad Soyad', 'Çalışan', 'Uzman', 'Yazılım Geliştirici', 'Bilgi Teknolojileri', 'venus, titan'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    worksheet['!cols'] = [{ wch: 26 }, { wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TopluGonderim');
    XLSX.writeFile(workbook, 'toplu_gonderim_sablon.xlsx');
  };

  const sendBulkCodes = async (persons: BulkPerson[]) => {
    try {
      setIsBulkSending(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      let totalCreditCost = 0;

      for (const person of persons) {
        try {
          const planets = person.planets.length > 0 ? person.planets : ['venus'];
          const codeResponse = await fetch('/api/generate-code', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: person.name,
              email: person.email,
              planet: planets[0],
              allPlanets: planets,
              personType: person.personType,
              unvan: person.unvan,
              pozisyon: person.pozisyon,
              departman: person.departman
            })
          });

          if (codeResponse.ok) {
            const codeData = await codeResponse.json();
            if (codeData.success && codeData.code) {
              const sendResponse = await fetch('/api/send-code', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: codeData.code,
                  name: person.name,
                  email: person.email,
                  planet: planets[0],
                  allPlanets: planets,
                  personType: person.personType,
                  unvan: person.unvan,
                  pozisyon: person.pozisyon,
                  departman: person.departman
                })
              });

              if (sendResponse.ok) {
                const sendData = await sendResponse.json();
                if (sendData.success) {
                  successCount += 1;
                  totalCreditCost += planets.length;
                } else {
                  errorCount += 1;
                  errors.push(formatPersonError(person.name, sendData.message || formatSendErrorLabel()));
                }
              } else {
                let errorMessage = formatSendErrorLabel();
                try {
                  const errorData = await sendResponse.json();
                  errorMessage = errorData.message || errorMessage;
                } catch {
                  errorMessage = formatServerError(sendResponse.status);
                }
                errorCount += 1;
                errors.push(formatPersonError(person.name, errorMessage));
              }
            } else {
              errorCount += 1;
              errors.push(formatPersonError(person.name, formatCodeGenerateMissing()));
            }
          } else {
            errorCount += 1;
            errors.push(formatPersonError(person.name, formatCodeGenerationFailed()));
          }
        } catch (error) {
          errorCount += 1;
          errors.push(formatPersonError(person.name, error instanceof Error ? error.message : t('labels.unknownError')));
        }
      }

      if (successCount > 0 && errorCount === 0) {
        const creditMessage = formatCreditSuccess(successCount, totalCreditCost, isSuperAdmin);
        showMessage(t('labels.success'), creditMessage, 'success');
        if (!isSuperAdmin) {
          try {
            const deductResponse = await creditAPI.deductCredits({
              amount: totalCreditCost,
              type: 'game_send',
              description: `${t('labels.personSend')}: ${successCount} ${t('labels.person')} (${totalCreditCost} ${t('labels.credits')})`
            });

            if (deductResponse.data.success) {
              const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
              localStorage.setItem('remainingCredits', remainingCredits.toString());
              localStorage.setItem('usedCredits', usedCredits.toString());
              localStorage.setItem('totalCredits', totalCredits.toString());
              setRemainingCredits(remainingCredits);
            }
          } catch (error) {
            showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else if (successCount > 0 && errorCount > 0) {
        const creditMessage = formatPartialSuccess(successCount, errorCount, totalCreditCost, isSuperAdmin);
        showMessage(t('labels.warning'), creditMessage, 'warning', errors);
        if (!isSuperAdmin) {
          try {
            const deductResponse = await creditAPI.deductCredits({
              amount: totalCreditCost,
              type: 'game_send',
              description: `${t('labels.personSend')}: ${successCount} ${t('labels.person')} (${totalCreditCost} ${t('labels.credits')})`
            });

            if (deductResponse.data.success) {
              const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
              localStorage.setItem('remainingCredits', remainingCredits.toString());
              localStorage.setItem('usedCredits', usedCredits.toString());
              localStorage.setItem('totalCredits', totalCredits.toString());
              setRemainingCredits(remainingCredits);
            }
          } catch (error) {
            showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else {
        showMessage(t('labels.error'), formatNoOneSent(), 'error', errors);
      }

      setBulkFile(null);
      setBulkRows([]);
      setBulkFileMeta(null);
      setBulkErrors([]);
    } catch (error) {
      safeLog('error', 'Toplu gönderim hatası', error);
      showMessage(t('labels.error'), t('errors.sendDuring'), 'error');
    } finally {
      setIsBulkSending(false);
    }
  };

  const handleBulkSend = () => {
    if (!bulkFile || bulkRows.length === 0) {
      showMessage(t('labels.error'), t('errors.selectExcelFirst'), 'error');
      return;
    }

    if (!isSuperAdmin) {
      const totalCreditCost = bulkRows.reduce((sum, row) => sum + row.planets.length, 0);
      if (remainingCredits < totalCreditCost) {
        showMessage(t('labels.error'), formatInsufficientCredits(remainingCredits, totalCreditCost), 'error');
        return;
      }
    }

    const confirmMessage = formatConfirmSend(bulkRows.length);
    showConfirm(t('labels.confirm'), confirmMessage, (result) => {
      if (result) {
        sendBulkCodes(bulkRows);
      }
    });
  };

  // Send person interview
  const sendPersonInterview = async () => {
    if (!personName || !personEmail || !personType || !personTitle || !personPosition || !personDepartment || selectedPlanets.length === 0) {
      showMessage(t('labels.error'), t('errors.fillAllFieldsSelectPlanet'), 'error');
      return;
    }

    // Super admin değilse kredi kontrolü yap
    if (!isSuperAdmin) {
      const creditCost = selectedPlanets.length;
      if (remainingCredits < creditCost) {
        showMessage(t('labels.error'), formatInsufficientCredits(remainingCredits, creditCost), 'error');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const primaryPlanet = selectedPlanets[0];

      // Generate code
      const codeResponse = await fetch('/api/generate-code', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: personName,
          email: personEmail,
          planet: primaryPlanet,
          allPlanets: selectedPlanets,
          personType,
          unvan: personTitle,
          pozisyon: personPosition,
          departman: personDepartment
        })
      });

      const codeData = await codeResponse.json();
      if (!codeData.success || !codeData.code) {
        throw new Error(t('errors.codeGenerateInvalid'));
      }

      // Send code
      const sendResponse = await fetch('/api/send-code', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: codeData.code,
          name: personName,
          email: personEmail,
          planet: primaryPlanet,
          allPlanets: selectedPlanets,
          personType,
          unvan: personTitle,
          pozisyon: personPosition,
          departman: personDepartment
        })
      });

      const sendData = await sendResponse.json();
      if (sendData.success) {
        const creditCost = selectedPlanets.length;
        showMessage(t('labels.success'), formatCodeSent(creditCost), 'success');
        // Clear form
        setPersonName('');
        setPersonEmail('');
        setPersonType('');
        setPersonTitle('');
        setPersonPosition('');
        setPersonDepartment('');
        setSelectedPlanets([]);
        // Kredi düşür (API ile) - Super admin için atla
        if (!isSuperAdmin) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: creditCost,
            type: 'game_send',
            description: `${t('labels.personSend')}: ${personName} (${creditCost} ${t('labels.planet')})`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else {
        showMessage(t('labels.error'), formatSendFailed(sendData.message), 'error');
      }
    } catch (error) {
      safeLog('error', 'Kod gönderme hatası', error);
      showMessage(t('labels.error'), formatSendErrorGeneric(), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send title interview
  const sendTitleInterview = async () => {
    if (selectedTitles.length === 0) {
      showMessage(t('labels.error'), t('errors.selectTitleAtLeastOne'), 'error');
      return;
    }

    if (selectedTitlePlanets.length === 0) {
      showMessage(t('labels.error'), t('errors.selectPlanetAtLeastOne'), 'error');
      return;
    }

    try {
      // Get all persons from selected titles
      const allPersons: Person[] = [];

      for (const titleId of selectedTitles) {
        const title = titles.find(t => t._id === titleId);
        safeLog('debug', 'Selected title:', title);
        
        if (title && title.organizations && title.organizations.length > 0) {
          // 1. Bu unvanın pozisyonlarını al (zaten title.organizations'da var)
          const orgPositions = title.organizations
            .map((org: any) => org.pozisyon)
            .filter(Boolean)
            .filter((position: string, index: number, arr: string[]) => arr.indexOf(position) === index); // Tekrarları kaldır
          
          safeLog('debug', 'Positions for this title:', orgPositions);
          
          if (orgPositions.length === 0) {
            safeLog('debug', 'No positions found for this title');
            continue;
          }
          
          // 2. Authorization API'sinden bu pozisyonlara sahip kişileri bul
          const response = await fetch('/api/authorization', {
            credentials: 'include'
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              safeLog('debug', 'Available authorizations:', result.authorizations.length);
              
              // Debug: Authorization'daki tüm title'ları göster
              const allAuthTitles = [...new Set(result.authorizations.map((p: any) => p.title))];
              safeLog('debug', 'All titles in authorization:', allAuthTitles);
              safeLog('debug', 'Looking for positions:', orgPositions);
              
              // Debug: Authorization verilerinin yapısını kontrol et
              safeLog('debug', 'First authorization sample:', result.authorizations[0]);
              safeLog('debug', 'Authorization fields:', Object.keys(result.authorizations[0] || {}));
              
              // Bu pozisyonlardaki kişileri bul (title alanında arama yap)
              const matchingPersons = result.authorizations.filter((person: any) => 
                orgPositions.includes(person.title)
              );
              
              // Debug: Title eşleştirmesini kontrol et
              safeLog('debug', 'Title matching debug:');
              result.authorizations.forEach((person: any, index: number) => {
                if (index < 3) { // İlk 3 kişiyi kontrol et
                  safeLog('debug', `Person ${index}:`, {
                    name: person.personName,
                    title: person.title,
                    isMatch: orgPositions.includes(person.title)
                  });
                }
              });
              
              safeLog('debug', `Found ${matchingPersons.length} persons in positions: ${orgPositions.join(', ')}`);
              
              // Debug: Eşleşmeyen pozisyonları göster
              const unmatchedPositions = orgPositions.filter(pos => !allAuthTitles.includes(pos));
              if (unmatchedPositions.length > 0) {
                safeLog('debug', 'Unmatched positions:', unmatchedPositions);
              }
              
              for (const person of matchingPersons) {
                safeLog('debug', 'Person details:', {
                  name: person.personName,
                  email: person.email,
                  pozisyon: person.pozisyon
                });
                
                  if (person.email) {
                    allPersons.push({
                      name: person.personName,
                      email: person.email,
                      title: person.title,
                      groupName: `${person.genelMudurYardimciligi} - ${person.direktörlük}`,
                      planets: selectedTitlePlanets // Seçilen gezegenleri kullan
                    });
                  }
              }
            }
          }
        }
      }

      if (allPersons.length === 0) {
        showMessage(t('labels.error'), t('errors.noEmailInTitle'), 'error');
        return;
      }

      // Super admin değilse kredi kontrolü yap
      if (!isSuperAdmin) {
        // Toplam kredi maliyetini hesapla
        const totalCreditCost = allPersons.length * selectedTitlePlanets.length;
        
        if (remainingCredits < totalCreditCost) {
          showMessage(t('labels.error'), formatInsufficientCredits(remainingCredits, totalCreditCost), 'error');
          return;
        }
      }

      // Show confirmation
      const confirmMessage = formatConfirmSend(allPersons.length);
      showConfirm(t('labels.confirm'), confirmMessage, (result) => {
        if (result) {
          sendCodesToTitlePersons(allPersons);
        }
      });
    } catch (error) {
      safeLog('error', 'Unvan gönderim hatası', error);
      showMessage(t('labels.error'), t('errors.sendDuring'), 'error');
    }
  };

  // Send group interview
  const sendGroupInterview = async () => {
    if (selectedGroups.length === 0) {
      showMessage(t('labels.error'), t('errors.selectGroupAtLeastOne'), 'error');
      return;
    }

    try {
      // Get all persons from selected groups
      const allPersons: Person[] = [];

      for (const groupId of selectedGroups) {
        const group = groups.find(g => g._id === groupId);
        if (group && group.persons && group.persons.length > 0) {
          // Get person details from authorization API
          const response = await fetch('/api/authorization', {
            credentials: 'include'
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              for (const personValue of group.persons) {
                const personName = personValue.includes(':') ? personValue.split(':')[1] : personValue;
                const personDetail = result.authorizations.find((p: any) => p.personName === personName);
                
                if (personDetail && personDetail.email) {
                  allPersons.push({
                    name: personDetail.personName,
                    email: personDetail.email,
                    title: personDetail.title,
                    groupName: group.name,
                    planets: group.planets || []
                  });
                }
              }
            }
          }
        }
      }

      if (allPersons.length === 0) {
        showMessage(t('labels.error'), t('errors.noEmailInGroup'), 'error');
        return;
      }

      // Super admin değilse kredi kontrolü yap
      if (!isSuperAdmin) {
        // Toplam kredi maliyetini hesapla
        let totalCreditCost = 0;
        for (const groupId of selectedGroups) {
          const group = groups.find(g => g._id === groupId);
          if (group && group.planets) {
            const groupPersonCount = group.persons ? group.persons.length : 0;
            totalCreditCost += groupPersonCount * group.planets.length;
          }
        }
        
        if (remainingCredits < totalCreditCost) {
          showMessage(t('labels.error'), formatInsufficientCredits(remainingCredits, totalCreditCost), 'error');
          return;
        }
      }

      // Show confirmation
      const confirmMessage = formatConfirmSend(allPersons.length);
      showConfirm(t('labels.confirm'), confirmMessage, (result) => {
        if (result) {
          sendCodesToPersons(allPersons);
        }
      });
    } catch (error) {
      safeLog('error', 'Grup gönderim hatası', error);
      showMessage(t('labels.error'), t('errors.sendDuring'), 'error');
    }
  };

  // Send codes to persons
  const sendCodesToPersons = async (allPersons: Person[]) => {
    try {
      setIsSubmitting(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const person of allPersons) {
        try {
          // Generate code for each person
          const codeResponse = await fetch('/api/generate-code', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: person.name,
              email: person.email,
              planet: person.planets[0] || 'venus',
              allPlanets: person.planets.length > 0 ? person.planets : ['venus']
            })
          });

          if (codeResponse.ok) {
            const codeData = await codeResponse.json();
            if (codeData.success && codeData.code) {
              // Send code to person
              const sendResponse = await fetch('/api/send-code', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: codeData.code,
                  name: person.name,
                  email: person.email,
                  planet: person.planets[0] || 'venus',
                  allPlanets: person.planets.length > 0 ? person.planets : ['venus']
                })
              });

              if (sendResponse.ok) {
                const sendData = await sendResponse.json();
                if (sendData.success) {
                  successCount++;
                } else {
                  errorCount++;
                  errors.push(formatPersonError(person.name, sendData.message || formatSendErrorLabel()));
                }
              } else {
                // 500 hatası için daha detaylı mesaj
                let errorMessage = formatSendErrorLabel();
                try {
                  const errorData = await sendResponse.json();
                  errorMessage = errorData.message || errorMessage;
                } catch {
                  errorMessage = formatServerError(sendResponse.status);
                }
                errorCount++;
                errors.push(formatPersonError(person.name, errorMessage));
              }
            } else {
              errorCount++;
              errors.push(formatPersonError(person.name, formatCodeGenerateMissing()));
            }
          } else {
            errorCount++;
            errors.push(formatPersonError(person.name, formatCodeGenerationFailed()));
          }
        } catch (error) {
          errorCount++;
          errors.push(formatPersonError(person.name, error instanceof Error ? error.message : t('labels.unknownError')));
        }
      }

      // Kredi hesaplama (başarılı gönderim sayısı * gezegen sayısı)
      // Her kişi için grup gezegen sayısını kullan
      let totalCreditCost = 0;
      for (const groupId of selectedGroups) {
        const group = groups.find(g => g._id === groupId);
        if (group && group.planets) {
          // Bu gruptaki kişi sayısı * gezegen sayısı
          const groupPersonCount = group.persons ? group.persons.length : 0;
          totalCreditCost += groupPersonCount * group.planets.length;
        }
      }
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        const creditMessage = formatCreditSuccess(successCount, totalCreditCost, isSuperAdmin);
        showMessage(t('labels.success'), creditMessage, 'success');
        // Kredi düşür (API ile) - Super admin için atla
        if (!isSuperAdmin) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `${t('labels.groupSend')}: ${successCount} ${t('labels.person')} (${totalCreditCost} ${t('labels.credits')})`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else if (successCount > 0 && errorCount > 0) {
        const creditMessage = formatPartialSuccess(successCount, errorCount, totalCreditCost, isSuperAdmin);
        showMessage(t('labels.partialSuccess'), creditMessage, 'warning', errors);
        safeLog('error', 'Gönderim hataları', errors);
        // Kredi düşür (sadece başarılı gönderimler için - API ile) - Super admin için atla
        if (!isSuperAdmin) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `${t('labels.groupSendPartial')}: ${successCount} ${t('labels.person')} (${totalCreditCost} ${t('labels.credits')})`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else {
        showMessage(t('labels.error'), formatNoOneSent(), 'error', errors);
        safeLog('error', 'Tüm gönderim hataları', errors);
      }

      // Clear selections
      setSelectedGroups([]);
    } catch (error) {
      safeLog('error', 'Grup gönderim hatası', error);
      showMessage(t('labels.error'), t('errors.sendDuring'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send codes to title persons
  const sendCodesToTitlePersons = async (allPersons: Person[]) => {
    try {
      setIsSubmitting(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const person of allPersons) {
        try {
          // Generate code for each person
          const codeResponse = await fetch('/api/generate-code', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: person.name,
              email: person.email,
              planet: person.planets[0] || 'venus',
              allPlanets: person.planets.length > 0 ? person.planets : ['venus']
            })
          });

          if (codeResponse.ok) {
            const codeData = await codeResponse.json();
            if (codeData.success && codeData.code) {
              // Send code to person
              const sendResponse = await fetch('/api/send-code', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: codeData.code,
                  name: person.name,
                  email: person.email,
                  planet: person.planets[0] || 'venus',
                  allPlanets: person.planets.length > 0 ? person.planets : ['venus']
                })
              });

              if (sendResponse.ok) {
                const sendData = await sendResponse.json();
                if (sendData.success) {
                  successCount++;
                } else {
                  errorCount++;
                  errors.push(formatPersonError(person.name, sendData.message || formatSendErrorLabel()));
                }
              } else {
                // 500 hatası için daha detaylı mesaj
                let errorMessage = formatSendErrorLabel();
                try {
                  const errorData = await sendResponse.json();
                  errorMessage = errorData.message || errorMessage;
                } catch {
                  errorMessage = formatServerError(sendResponse.status);
                }
                errorCount++;
                errors.push(`${person.name}: ${errorMessage}`);
              }
            } else {
              errorCount++;
              errors.push(formatPersonError(person.name, formatCodeGenerateMissing()));
            }
          } else {
            errorCount++;
            errors.push(formatPersonError(person.name, formatCodeGenerationFailed()));
          }
        } catch (error) {
          errorCount++;
          errors.push(formatPersonError(person.name, error instanceof Error ? error.message : t('labels.unknownError')));
        }
      }

      // Kredi hesaplama (başarılı gönderim sayısı * gezegen sayısı)
      const totalCreditCost = successCount * selectedTitlePlanets.length;
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        const creditMessage = formatCreditSuccess(successCount, totalCreditCost, isSuperAdmin);
        showMessage(t('labels.success'), creditMessage, 'success');
        // Kredi düşür (API ile) - Super admin için atla
        if (!isSuperAdmin) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `${t('labels.titleSend')}: ${successCount} ${t('labels.person')} (${totalCreditCost} ${t('labels.credits')})`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else if (successCount > 0 && errorCount > 0) {
        const creditMessage = formatPartialSuccess(successCount, errorCount, totalCreditCost, isSuperAdmin);
        showMessage(t('labels.partialSuccess'), creditMessage, 'warning', errors);
        safeLog('error', 'Gönderim hataları', errors);
        // Kredi düşür (sadece başarılı gönderimler için - API ile) - Super admin için atla
        if (!isSuperAdmin) {
        try {
          const deductResponse = await creditAPI.deductCredits({
            amount: totalCreditCost,
            type: 'game_send',
            description: `${t('labels.titleSendPartial')}: ${successCount} ${t('labels.person')} (${totalCreditCost} ${t('labels.credits')})`
          });
          
          if (deductResponse.data.success) {
            // localStorage'ı güncelle
            const { totalCredits, usedCredits, remainingCredits } = deductResponse.data.credit;
            localStorage.setItem('remainingCredits', remainingCredits.toString());
            localStorage.setItem('usedCredits', usedCredits.toString());
            localStorage.setItem('totalCredits', totalCredits.toString());
            
            // UI'yi güncelle
            setRemainingCredits(remainingCredits);
          }
        } catch (error) {
          showMessage(t('labels.error'), formatCreditDeductionFailed(error.response?.data?.message || error.message), 'error');
          }
        }
      } else {
        showMessage(t('labels.error'), formatNoOneSent(), 'error', errors);
        safeLog('error', 'Tüm gönderim hataları', errors);
      }

      // Clear selections
      setSelectedTitles([]);
      setSelectedTitlePlanets([]);
    } catch (error) {
      safeLog('error', 'Unvan gönderim hatası', error);
      showMessage(t('labels.error'), t('errors.sendDuring'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal functions
  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', failedPersons: string[] = []) => {
    setMessageModal({ title, message, type, failedPersons });
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
  };

  const showConfirm = (title: string, message: string, callback: (result: boolean) => void) => {
    setConfirmModal({ title, message, callback });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = (result: boolean) => {
    setShowConfirmModal(false);
    if (confirmModal.callback) {
      confirmModal.callback(result);
    }
  };

  const closeGroupDetailsModal = () => {
    setShowGroupDetailsModal(false);
    setSelectedGroupDetails(null);
  };

  const closeTitleDetailsModal = () => {
    setShowTitleDetailsModal(false);
    setSelectedTitleDetails(null);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F8F9FA',
      fontFamily: 'Inter, sans-serif',
      touchAction: 'pan-x pan-y pinch-zoom',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        height: '76px',
        padding: '16px 32px',
        background: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                <div style={{ color: '#232D42', fontSize: '16px', fontWeight: 400, lineHeight: '28px' }}>Andron Games</div>
                <div style={{ color: '#8A92A6', fontSize: '13px', fontWeight: 400, lineHeight: '16.90px' }}>Founder</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title */}
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
        marginLeft: '10px'
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}>
          <div style={{
            color: 'white',
            fontSize: '30px',
            fontWeight: 700
          }}>
            {t('titles.gameSend')}
          </div>
        </div>
      </div>

      {/* Kalan Oyun Sayısı - Header Altında */}
      <div style={{
        position: 'absolute',
        top: '170px',
        right: '5%',
        zIndex: 10
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E9ECEF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: '120px'
        }}>
          <div style={{
            color: '#8A92A6',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}>
            {t('labels.remainingGameCount')}
          </div>
          <div style={{
            color: '#3B8AFF',
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'Inter'
          }}>
            {isSuperAdmin ? '∞' : remainingCredits.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '40px',
        width: '90%',
        maxWidth: '800px',
        margin: '0 auto',
        marginTop: '20px',
        position: 'relative',
        touchAction: 'pan-x pan-y pinch-zoom',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Tab Container */}
        <div style={{
          display: 'flex',
          background: '#F8F9FA',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => switchTab('person')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'person'
                ? 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'person' ? 'white' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'person' ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none'
            }}
          >
            {t('labels.person')}
          </button>
          <button
            onClick={() => switchTab('group')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'group'
                ? 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'group' ? 'white' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'group' ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none'
            }}
          >
            {t('labels.group')}
          </button>
          <button
            onClick={() => switchTab('title')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'title'
                ? 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'title' ? 'white' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'title' ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none'
            }}
          >
            {t('labels.title')}
          </button>
          <button
            onClick={() => switchTab('bulk')}
            style={{
              flex: 1,
              padding: '12px 24px',
              textAlign: 'center',
              background: activeTab === 'bulk'
                ? 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'bulk' ? 'white' : '#8A92A6',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'bulk' ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none'
            }}
          >
            {t('labels.bulkSendTab')}
          </button>
        </div>

        {/* Person Tab Content */}
        {activeTab === 'person' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '32px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }}>
                    <i className="fa-regular fa-envelope" />
                  </div>
                  <input
                    type="email"
                    value={personEmail}
                    onChange={(e) => setPersonEmail(e.target.value)}
                    placeholder={t('placeholders.email')}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  {t('labels.nameSurname')}
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }}>
                    <i className="fa-regular fa-user" />
                  </div>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder={t('placeholders.nameSurname')}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  {t('labels.personType')}
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    zIndex: 1
                  }}>
                    <i className="fa-solid fa-user-tag" />
                  </div>
                  <select
                    value={personType}
                    onChange={(e) => setPersonType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 36px 12px 40px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">{t('placeholders.personType')}</option>
                    <option value="Aday">Aday</option>
                    <option value="Çalışan">Çalışan</option>
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    pointerEvents: 'none'
                  }}>
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  {t('labels.title')}
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }}>
                    <i className="fa-solid fa-briefcase" />
                  </div>
                  <select
                    value={personTitle}
                    onChange={(e) => {
                      setPersonTitle(e.target.value);
                      setPersonPosition('');
                    }}
                    disabled={isOrgLoading}
                    style={{
                      width: '100%',
                      padding: '12px 36px 12px 40px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      appearance: 'none',
                      cursor: isOrgLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">{t('placeholders.title')}</option>
                    {availableTitles.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    pointerEvents: 'none'
                  }}>
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  {t('labels.position')}
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }}>
                    <i className="fa-solid fa-id-badge" />
                  </div>
                  <select
                    value={personPosition}
                    onChange={(e) => setPersonPosition(e.target.value)}
                    disabled={isOrgLoading}
                    style={{
                      width: '100%',
                      padding: '12px 36px 12px 40px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      appearance: 'none',
                      cursor: isOrgLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">{t('placeholders.position')}</option>
                    {availablePositions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    pointerEvents: 'none'
                  }}>
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  {t('labels.departmentLeadership')}
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    zIndex: 1
                  }}>
                    <i className="fa-solid fa-building" />
                  </div>
                  <select
                    value={personDepartment}
                    onChange={(e) => {
                      setPersonDepartment(e.target.value);
                      setPersonTitle('');
                      setPersonPosition('');
                    }}
                    disabled={isOrgLoading}
                    style={{
                      width: '100%',
                      padding: '12px 36px 12px 40px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      appearance: 'none',
                      cursor: isOrgLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">{t('placeholders.departmentLeadership')}</option>
                    {availableDepartments.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    pointerEvents: 'none'
                  }}>
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '10px'
                }}>
                  {t('labels.planetSelection')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }} data-dropdown="planet">
                      <div
                        onClick={() => setShowPlanetDropdown(!showPlanetDropdown)}
                        style={{
                          padding: '12px 14px 12px 40px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: '#232D42',
                          backgroundColor: '#F9FAFB',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ color: planetSearchTerm ? '#232D42' : '#9CA3AF' }}>
                          {planetSearchTerm || t('placeholders.selectPlanet')}
                        </span>
                        <i
                          className={`fas fa-chevron-${showPlanetDropdown ? 'up' : 'down'}`}
                          style={{
                            color: '#9CA3AF',
                            fontSize: '12px',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9CA3AF'
                        }}>
                          <i className="fa-solid fa-globe" />
                        </div>
                      </div>

                      {showPlanetDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
                          zIndex: 1000,
                          maxHeight: '220px',
                          overflow: 'hidden',
                          marginTop: '6px'
                        }}>
                          <div style={{ padding: '8px', borderBottom: '1px solid #E5E7EB', position: 'relative' }}>
                            <input
                              type="text"
                              placeholder={t('placeholders.searchPlanet')}
                              value={planetSearchTerm}
                              onChange={(e) => setPlanetSearchTerm(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px 8px 32px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <i className="fas fa-search" style={{
                              position: 'absolute',
                              left: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#6B7280',
                              fontSize: '12px'
                            }} />
                            {planetSearchTerm && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlanetSearchTerm('');
                                }}
                                style={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  color: '#6B7280',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '2px'
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>

                          <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                            {filteredPlanets
                              .filter(planet => !selectedPlanets.includes(planet.value))
                              .map(planet => (
                                <div
                                  key={planet.value}
                                  onClick={() => addPlanet(planet.value)}
                                  style={{
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#232D42',
                                    borderBottom: '1px solid #F3F4F6'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  {highlightText(capitalizeFirstLetter(planet.label), planetSearchTerm)}
                                </div>
                              ))}

                            {planetSearchTerm && filteredPlanets.filter(planet => !selectedPlanets.includes(planet.value)).length === 0 && (
                              <div style={{
                                padding: '12px 16px',
                                color: '#9CA3AF',
                                fontSize: '14px',
                                textAlign: 'center'
                              }}>
                                {formatNoSearchResults(planetSearchTerm)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    minHeight: '40px',
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    background: '#F9FAFB'
                  }}>
                    {selectedPlanets.map((planetValue) => {
                      const planet = availablePlanets.find(p => p.value === planetValue);
                      return planet ? (
                        <div
                          key={planetValue}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#4361ee',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            userSelect: 'none'
                          }}
                        >
                          {capitalizeFirstLetter(planet.label)}
                          <button
                            onClick={() => removePlanet(planetValue)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '0',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                onClick={sendPersonInterview}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <i className="fas fa-paper-plane"></i>
                {isSubmitting ? t('statuses.sending') : t('buttons.send')}
              </button>
            </div>
          </div>
        )}

        {/* Group Tab Content */}
        {activeTab === 'group' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                {t('labels.groupSelection')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="group">
                    <div
                      onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: groupSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {groupSearchTerm || t('placeholders.selectGroup')}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showGroupDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showGroupDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder={t('placeholders.searchGroup')}
                            value={groupSearchTerm}
                            onChange={(e) => setGroupSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <i className="fas fa-search" style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6B7280',
                            fontSize: '12px'
                          }} />
                          {groupSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupSearchTerm('');
                              }}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '2px'
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>

                        {/* Options */}
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {filteredGroups
                            .filter(group => !selectedGroups.includes(group._id))
                            .map(group => (
                              <div
                                key={group._id}
                                onClick={() => addGroup(group._id)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#232D42',
                                  borderBottom: '1px solid #F1F3F4',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {highlightText(group.name, groupSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {groupSearchTerm && filteredGroups.filter(group => !selectedGroups.includes(group._id)).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              {formatNoSearchResults(groupSearchTerm)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  background: '#f8f9fa'
                }}>
                  {selectedGroups.map(groupId => {
                    const group = groups.find(g => g._id === groupId);
                    return group ? (
                      <div
                        key={groupId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#17a2b8',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          userSelect: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {highlightText(group.name, groupSearchTerm)}
                        <button
                          onClick={() => removeGroup(groupId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                        <button
                          onClick={() => showGroupDetails(groupId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '4px'
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={sendGroupInterview}
              disabled={isSubmitting}
              style={{
                background: '#3A57E8',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '30px',
                transition: 'background-color 0.3s',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <i className="fas fa-paper-plane"></i>
              {isSubmitting ? t('statuses.sending') : t('buttons.sendGroupMembers')}
            </button>
          </div>
        )}

        {/* Title Tab Content */}
        {activeTab === 'title' && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                {t('labels.titleSelection')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="title">
                    <div
                      onClick={() => setShowTitleDropdown(!showTitleDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: titleSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {titleSearchTerm || t('placeholders.selectTitle')}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showTitleDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showTitleDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder={t('placeholders.searchTitle')}
                            value={titleSearchTerm}
                            onChange={(e) => setTitleSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <i className="fas fa-search" style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6B7280',
                            fontSize: '12px'
                          }} />
                          {titleSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTitleSearchTerm('');
                              }}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '2px'
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>

                        {/* Options */}
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {filteredTitles
                            .filter(title => !selectedTitles.includes(title._id))
                            .map(title => (
                              <div
                                key={title._id}
                                onClick={() => addTitle(title._id)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#232D42',
                                  borderBottom: '1px solid #F1F3F4',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {highlightText(title.name, titleSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {titleSearchTerm && filteredTitles.filter(title => !selectedTitles.includes(title._id)).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              {formatNoSearchResults(titleSearchTerm)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  background: '#f8f9fa'
                }}>
                  {selectedTitles.map(titleId => {
                    const title = titles.find(t => t._id === titleId);
                    return title ? (
                      <div
                        key={titleId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#6f42c1',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          userSelect: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {highlightText(title.name, titleSearchTerm)}
                        <button
                          onClick={() => removeTitle(titleId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                        <button
                          onClick={() => showTitleDetails(titleId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '4px'
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: 'black',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                {t('labels.planetSelection')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Custom Dropdown */}
                  <div style={{ flex: 1, position: 'relative' }} data-dropdown="titlePlanet">
                    <div
                      onClick={() => setShowTitlePlanetDropdown(!showTitlePlanetDropdown)}
                      style={{
                        padding: '16px',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#232D42',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: titlePlanetSearchTerm ? '#232D42' : '#8A92A6' }}>
                        {titlePlanetSearchTerm || t('placeholders.selectPlanet')}
                      </span>
                      <i 
                        className={`fas fa-chevron-${showTitlePlanetDropdown ? 'up' : 'down'}`}
                        style={{ 
                          color: '#8A92A6',
                          fontSize: '12px',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {showTitlePlanetDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflow: 'hidden'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #E9ECEF', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder={t('placeholders.searchPlanet')}
                            value={titlePlanetSearchTerm}
                            onChange={(e) => setTitlePlanetSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px 8px 32px',
                              border: '1px solid #E9ECEF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <i className="fas fa-search" style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6B7280',
                            fontSize: '12px'
                          }} />
                          {titlePlanetSearchTerm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTitlePlanetSearchTerm('');
                              }}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '2px'
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>

                        {/* Options */}
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {availablePlanets
                            .filter(planet => !selectedTitlePlanets.includes(planet.value))
                            .filter(planet => {
                              if (!titlePlanetSearchTerm) return true;
                              const normalizedSearch = titlePlanetSearchTerm.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              const normalizedLabel = planet.label.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              return normalizedLabel.includes(normalizedSearch);
                            })
                            .map(planet => (
                              <div
                                key={planet.value}
                                onClick={() => {
                                  setSelectedTitlePlanets([...selectedTitlePlanets, planet.value]);
                                  setTitlePlanetSearchTerm('');
                                  setShowTitlePlanetDropdown(false);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#232D42',
                                  borderBottom: '1px solid #F1F3F4',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {highlightText(capitalizeFirstLetter(planet.label), titlePlanetSearchTerm)}
                              </div>
                            ))}
                          
                          {/* No results message */}
                          {titlePlanetSearchTerm && availablePlanets
                            .filter(planet => !selectedTitlePlanets.includes(planet.value))
                            .filter(planet => {
                              if (!titlePlanetSearchTerm) return true;
                              const normalizedSearch = titlePlanetSearchTerm.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              const normalizedLabel = planet.label.toLowerCase()
                                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                              return normalizedLabel.includes(normalizedSearch);
                            }).length === 0 && (
                            <div style={{
                              padding: '12px 16px',
                              color: '#8A92A6',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}>
                              {formatNoSearchResults(titlePlanetSearchTerm)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  background: '#f8f9fa'
                }}>
                  {selectedTitlePlanets.map((planetValue, index) => {
                    const planet = availablePlanets.find(p => p.value === planetValue);
                    return planet ? (
                      <div
                        key={planetValue}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#6f42c1',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          userSelect: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        <div style={{ cursor: 'grab', padding: '2px', borderRadius: '3px' }}>
                          <i className="fas fa-grip-vertical"></i>
                        </div>
                        {capitalizeFirstLetter(planet.label)}
                        <button
                          onClick={() => removeTitlePlanet(planetValue)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={sendTitleInterview}
              disabled={isSubmitting}
              style={{
                background: '#3A57E8',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '30px',
                transition: 'background-color 0.3s',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <i className="fas fa-paper-plane"></i>
              {isSubmitting ? t('statuses.sending') : t('buttons.sendTitleMembers')}
            </button>
          </div>
        )}

        {/* Bulk (Excel) Tab Content */}
        {activeTab === 'bulk' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '32px'
          }}>
            <div
              onClick={() => document.getElementById('bulkExcelInput')?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsBulkDragging(true);
              }}
              onDragLeave={() => setIsBulkDragging(false)}
              onDrop={handleBulkDrop}
              style={{
                border: '2px dashed',
                borderColor: isBulkDragging ? '#2563EB' : '#D1D5DB',
                borderRadius: '16px',
                padding: '28px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isBulkDragging ? '#EFF6FF' : '#F9FAFB',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #DCFCE7 0%, #D1FAE5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-file-excel" style={{ color: '#16A34A', fontSize: '22px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                    {t('labels.uploadExcelFile')}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', maxWidth: '360px' }}>
                    {t('labels.selectOrDropExcel')}
                  </div>
                </div>
                <button
                  style={{
                    marginTop: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: 'linear-gradient(90deg, #16A34A 0%, #10B981 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-upload" />
                  {t('buttons.upload')}
                </button>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  {t('labels.supportedFormats')}
                </div>
              </div>
            </div>

            <input
              type="file"
              id="bulkExcelInput"
              accept=".xlsx,.xls"
              onChange={handleBulkFileChange}
              style={{ display: 'none' }}
            />

            {bulkFileMeta && (
              <div style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'linear-gradient(90deg, #DCFCE7 0%, #ECFDF3 100%)',
                border: '1px solid #A7F3D0',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-file-excel" style={{ color: '#16A34A' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{bulkFileMeta.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {bulkFileMeta.sizeLabel} • {bulkFileMeta.rowCount} kayıt
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBulkFile();
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#FEE2E2',
                    color: '#B91C1C',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-xmark" />
                </button>
              </div>
            )}

            {bulkErrors.length > 0 && (
              <div style={{
                marginTop: '14px',
                padding: '12px 16px',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#92400E',
                whiteSpace: 'pre-line'
              }}>
                {bulkErrors.slice(0, 6).map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
                {bulkErrors.length > 6 && <div>… ({bulkErrors.length - 6} hata daha)</div>}
              </div>
            )}

            <div style={{
              marginTop: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(90deg, #DBEAFE 0%, #E0F2FE 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-download" style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E3A8A' }}>
                    {t('labels.bulkUploadTemplateTitle')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1D4ED8' }}>
                    {t('labels.bulkUploadTemplateDesc')}
                  </div>
                </div>
              </div>
              <button
                onClick={downloadBulkTemplate}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #2563EB',
                  background: 'transparent',
                  color: '#2563EB',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('buttons.downloadTemplate')}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
              <button
                onClick={handleBulkSend}
                disabled={isBulkSending || bulkRows.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isBulkSending || bulkRows.length === 0
                    ? '#9CA3AF'
                    : 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: isBulkSending || bulkRows.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="fas fa-paper-plane" />
                {isBulkSending ? t('statuses.sending') : t('buttons.send')}
              </button>
            </div>

          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '12px',
          marginTop: '20px'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
            border: '1px solid #BFDBFE'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              <i className="fas fa-coins" />
            </div>
            <div style={{ fontSize: '12px', color: '#1E3A8A' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{t('labels.creditInfoTitle')}</div>
              <div>{t('labels.creditInfoText')}</div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
            border: '1px solid #FDE68A'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              <i className="fas fa-circle-exclamation" />
            </div>
            <div style={{ fontSize: '12px', color: '#92400E' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{t('labels.autoRefundTitle')}</div>
              <div>{t('labels.autoRefundText')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Details Modal */}
      {showGroupDetailsModal && selectedGroupDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #E9ECEF'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {selectedGroupDetails.name} - {t('labels.details')}
              </h3>
              <button
                onClick={closeGroupDetailsModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#8A92A6',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                color: '#232D42',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '10px'
              }}>
                {t('labels.groupInfo')}
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{
                  background: '#F8F9FA',
                  border: '1px solid #DEE2E6',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  Durum: {selectedGroupDetails.status}
                </span>
                <span style={{
                  background: '#F8F9FA',
                  border: '1px solid #DEE2E6',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {t('labels.createdAt')}: {new Date(selectedGroupDetails.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}
                </span>
              </div>
            </div>

            {/* Organizations */}
            {selectedGroupDetails.organizations && Array.isArray(selectedGroupDetails.organizations) && selectedGroupDetails.organizations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  Organizasyonlar ({selectedGroupDetails.organizations.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedGroupDetails.organizations
                    .filter(org => org != null) // null/undefined değerleri filtrele
                    .map((org: any, index) => {
                      let displayValue = '';
                      
                      // Eğer organization populate edilmişse (object), güncel isimleri göster
                      if (typeof org === 'object' && org !== null && org._id) {
                        // Populated organization object - güncel isimleri göster
                        if (org.genelMudurYardimciligi && org.genelMudurYardimciligi !== '-') {
                          displayValue = org.genelMudurYardimciligi;
                        } else if (org.direktörlük && org.direktörlük !== '-') {
                          displayValue = org.direktörlük;
                        } else if (org.müdürlük && org.müdürlük !== '-') {
                          displayValue = org.müdürlük;
                        } else if (org.grupLiderligi && org.grupLiderligi !== '-') {
                          displayValue = org.grupLiderligi;
                        } else if (org.pozisyon) {
                          displayValue = org.pozisyon;
                        } else {
                          displayValue = 'Bilinmeyen';
                        }
                      } else {
                        // String format (eski format veya populate edilmemiş)
                        const orgString = typeof org === 'string' ? org : String(org || '');
                        displayValue = orgString.includes(':') ? orgString.split(':')[1] : orgString;
                      }
                      
                      return (
                        <span
                          key={index}
                          style={{
                            background: '#E8F5E8',
                            border: '1px solid #C8E6C9',
                            color: '#388E3C',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          {displayValue}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Persons */}
            {selectedGroupDetails.persons && selectedGroupDetails.persons.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  {t('labels.groupMembers')} ({selectedGroupDetails.persons.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedGroupDetails.persons.map((person: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        background: '#E3F2FD',
                        border: '1px solid #BBDEFB',
                        color: '#1976D2',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {person.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {person.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {person.email}
                        </div>
                      </div>
                      <div style={{
                        background: '#1976D2',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {person.sicilNo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Planets */}
            {selectedGroupDetails.planets && Array.isArray(selectedGroupDetails.planets) && selectedGroupDetails.planets.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  {t('labels.planets')} ({selectedGroupDetails.planets.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedGroupDetails.planets
                    .filter(planet => planet != null) // null/undefined değerleri filtrele
                    .map((planet, index) => {
                      // planet'in string olduğundan emin ol
                      const planetStr = typeof planet === 'string' ? planet : String(planet || '');
                      // Önce availablePlanets'ten bul, yoksa string olarak kullan
                      const planetObj = availablePlanets.find(p => p.value === planetStr);
                      let displayValue = planetObj ? planetObj.label : planetStr;
                      // Eğer hala ':' içeriyorsa (eski format), split et
                      if (typeof displayValue === 'string' && displayValue.includes(':')) {
                        displayValue = displayValue.split(':')[1];
                      }
                      return (
                        <span
                          key={index}
                          style={{
                            background: '#F3E5F5',
                            border: '1px solid #E1BEE7',
                            color: '#7B1FA2',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          {capitalizeFirstLetter(displayValue)}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title Details Modal */}
      {showTitleDetailsModal && selectedTitleDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #E9ECEF'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {selectedTitleDetails.name} - {t('labels.details')}
              </h3>
              <button
                onClick={closeTitleDetailsModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#8A92A6',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                color: '#232D42',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '10px'
              }}>
                {t('labels.titleInfo')}
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{
                  background: '#F8F9FA',
                  border: '1px solid #DEE2E6',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {t('labels.title')}: {selectedTitleDetails.name}
                </span>
                <span style={{
                  background: '#F8F9FA',
                  border: '1px solid #DEE2E6',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {t('labels.organizationCount')}: {selectedTitleDetails.organizations.length}
                </span>
              </div>
            </div>

            {/* Organizations */}
            {selectedTitleDetails.organizations && selectedTitleDetails.organizations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  {t('labels.titleInfo')} ({selectedTitleDetails.organizations.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedTitleDetails.organizations.map((org: any, index: number) => (
                    <span
                      key={index}
                      style={{
                        background: '#E8F5E8',
                        border: '1px solid #C8E6C9',
                        color: '#388E3C',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {org.unvan}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Persons */}
            {selectedTitleDetails.persons && selectedTitleDetails.persons.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  {t('labels.titleMembers')} ({selectedTitleDetails.persons.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedTitleDetails.persons.map((person: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        background: '#E3F2FD',
                        border: '1px solid #BBDEFB',
                        color: '#1976D2',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {person.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {person.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {person.email}
                        </div>
                      </div>
                      <div style={{
                        background: '#1976D2',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {person.sicilNo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #E9ECEF'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                background: messageModal.type === 'success' ? '#D4EDDA' : 
                           messageModal.type === 'error' ? '#F8D7DA' :
                           messageModal.type === 'warning' ? '#FFF3CD' : '#D1ECF1',
                color: messageModal.type === 'success' ? '#155724' : 
                       messageModal.type === 'error' ? '#721C24' :
                       messageModal.type === 'warning' ? '#856404' : '#0C5460'
              }}>
                <i className={`fas ${
                  messageModal.type === 'success' ? 'fa-check-circle' :
                  messageModal.type === 'error' ? 'fa-times-circle' :
                  messageModal.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
                }`}></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {messageModal.title}
              </h3>
            </div>
            <div style={{
              padding: '16px 24px 24px 24px',
              color: '#495057',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {messageModal.message}
              
              {/* Gönderilemeyen kişiler listesi */}
              {messageModal.failedPersons && messageModal.failedPersons.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#F8F9FA',
                  borderRadius: '6px',
                  border: '1px solid #E9ECEF'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6C757D',
                    marginBottom: '8px'
                  }}>
                    {t('labels.failedRecipients')}
                  </div>
                  <div style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    fontSize: '12px',
                    color: '#495057'
                  }}>
                    {messageModal.failedPersons.map((error, index) => (
                      <div key={index} style={{
                        padding: '4px 0',
                        borderBottom: index < messageModal.failedPersons.length - 1 ? '1px solid #E9ECEF' : 'none'
                      }}>
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '0 24px 24px 24px'
            }}>
              <button
                onClick={closeMessageModal}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '80px',
                  background: '#3A57E8',
                  color: 'white'
                }}
              >
                {t('buttons.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #E9ECEF'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                background: '#FFF3CD',
                color: '#856404'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {confirmModal.title}
              </h3>
            </div>
            <div style={{
              padding: '16px 24px 24px 24px',
              color: '#495057',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {confirmModal.message}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '0 24px 24px 24px'
            }}>
              <button
                onClick={() => closeConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '80px',
                  background: '#6C757D',
                  color: 'white'
                }}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={() => closeConfirmModal(true)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '80px',
                  background: '#3A57E8',
                  color: 'white'
                }}
              >
                {t('buttons.yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default GameSendPage;
