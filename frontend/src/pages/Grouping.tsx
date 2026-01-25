import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Group {
  _id: string;
  groupName: string;
  name?: string; // Backward compatibility
  isActive: boolean;
  details?: string;
  organizations?: string[];
  persons?: string[];
  planets?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Organization {
  value: string;
  label: string;
  type: string;
  orgId?: string; // Organization ID'si (kalıcı çözüm için)
}

interface Person {
  value: string;
  label: string;
}

interface Planet {
  value: string;
  label: string;
}

const Grouping: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  // State management
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Popup states
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showBulkDeletePopup, setShowBulkDeletePopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form states
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const formatNoResultsText = (term: string, emptyKey: string) => {
    if (term) {
      return language === 'en'
        ? `No results found for "${term}"`
        : `"${term}" için arama sonucu bulunamadı`;
    }
    return t(emptyKey);
  };

  const formatSearchResultsCount = (term: string, count: number) =>
    language === 'en'
      ? `${count} results found for "${term}"`
      : `"${term}" için ${count} sonuç bulundu`;

  const formatBulkDeleteConfirm = (count: number) =>
    language === 'en'
      ? `Are you sure you want to delete ${count} groups? This action cannot be undone.`
      : `${count} adet grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`;

  const formatSingleDeleteConfirm = () =>
    language === 'en'
      ? 'Are you sure you want to delete this group? This action cannot be undone.'
      : 'Bu grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.';

  const formatBulkDeleteSuccess = (count: number) =>
    language === 'en'
      ? `${count} groups deleted successfully.`
      : `${count} grup başarıyla silindi.`;

  const formatDeleteGroupConfirm = (name: string) =>
    language === 'en'
      ? `Are you sure you want to delete "${name}"? This action cannot be undone.`
      : `"${name}" grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`;

  const formatAutoPersonsAdded = (count: number, positionCount: number) =>
    language === 'en'
      ? `${count} people were added automatically. (${positionCount} positions)`
      : `${count} kişi otomatik olarak eklendi! (${positionCount} farklı pozisyondan)`;
  const [formData, setFormData] = useState({
    groupName: '',
    isActive: true
  });
  
  // Selection states
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]); // Organization ID'leri saklanacak
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]); // Organization ID'leri için ayrı state
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [manualPersons, setManualPersons] = useState<string[]>([]); // Manuel eklenen kişiler
  const [autoPersons, setAutoPersons] = useState<string[]>([]); // Otomatik eklenen kişiler
  
  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allOrganizationsData, setAllOrganizationsData] = useState<any[]>([]); // Tüm organization verilerini sakla (ID eşleştirmesi için)
  const [persons, setPersons] = useState<Person[]>([]);
  const [planets, setPlanets] = useState<Planet[]>([]);
  
  // Organization search states
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [showOrganizationDropdown, setShowOrganizationDropdown] = useState(false);
  
  // Person search states
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [personSearchTerm, setPersonSearchTerm] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  
  // Planet search states
  const [filteredPlanets, setFilteredPlanets] = useState<Planet[]>([]);
  const [planetSearchTerm, setPlanetSearchTerm] = useState('');
  const [showPlanetDropdown, setShowPlanetDropdown] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Scroll pozisyonunu koru
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('groupingScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sayfa değiştiğinde seçimleri temizle
  useEffect(() => {
    setSelectedItems([]);
  }, [currentPage]);

  // Sayfa yüklendiğinde scroll pozisyonunu geri yükle
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('groupingScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadOrganizations();
    loadPersons();
    loadPlanets();
  }, []);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-organization-dropdown]')) {
        setShowOrganizationDropdown(false);
      }
      if (!target.closest('[data-person-dropdown]')) {
        setShowPersonDropdown(false);
      }
      if (!target.closest('[data-planet-dropdown]')) {
        setShowPlanetDropdown(false);
      }
    };

    if (showOrganizationDropdown || showPersonDropdown || showPlanetDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrganizationDropdown, showPersonDropdown, showPlanetDropdown]);

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
        // Grupları sırala: Aktifler üstte, pasifler altta, her grup kendi içinde eklenme zamanına göre
        const sortedGroups = (result.groups || []).sort((a: any, b: any) => {
          // Önce status'a göre sırala (Aktif > Pasif)
          if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
          if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
          
          // Aynı status'taysa, eklenme zamanına göre sırala (yeni olan üstte)
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setGroups(sortedGroups);
      } else {
        throw new Error(result.message || t('errors.groupListFetch'));
      }
    } catch (error) {
      console.error('❌ Grup yükleme hatası:', error);
      setErrorMessage(t('errors.groupsLoad'));
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organization', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const orgs: Organization[] = [];
          
          // Organization'ları state'te sakla (ID eşleştirmesi için)
          const allOrgs = result.organizations || [];
          setAllOrganizationsData(allOrgs); // Tüm organization verilerini sakla
          
          // Her alan için benzersiz değerleri topla ve alfabetik sırala
          const genelMudurYardimciliklari = [...new Set(allOrgs.map((org: any) => org.genelMudurYardimciligi).filter(Boolean) || [])] as string[];
          const direktörlükler = [...new Set(allOrgs.map((org: any) => org.direktörlük).filter(Boolean) || [])] as string[];
          const müdürlükler = [...new Set(allOrgs.map((org: any) => org.müdürlük).filter(Boolean) || [])] as string[];
          const grupLiderlikleri = [...new Set(allOrgs.map((org: any) => org.grupLiderligi).filter(Boolean) || [])] as string[];
          const pozisyonlar = [...new Set(allOrgs.map((org: any) => org.pozisyon).filter(Boolean) || [])] as string[];
          
          // Alfabetik sıralama
          genelMudurYardimciliklari.sort((a, b) => a.localeCompare(b, 'tr'));
          direktörlükler.sort((a, b) => a.localeCompare(b, 'tr'));
          müdürlükler.sort((a, b) => a.localeCompare(b, 'tr'));
          grupLiderlikleri.sort((a, b) => a.localeCompare(b, 'tr'));
          pozisyonlar.sort((a, b) => a.localeCompare(b, 'tr'));

          // Genel Müdür Yardımcılıkları - İlk eşleşeni al
          genelMudurYardimciliklari.forEach(value => {
            const matchingOrg = allOrgs.find((org: any) => org.genelMudurYardimciligi === value);
            orgs.push({
              value: `genelMudurYardimciligi:${value}`,
              label: value,
              type: 'genelMudurYardimciligi',
              orgId: matchingOrg?._id
            });
          });
          
          // Direktörlükler - İlk eşleşeni al
          direktörlükler.forEach(value => {
            const matchingOrg = allOrgs.find((org: any) => org.direktörlük === value);
            orgs.push({
              value: `direktörlük:${value}`,
              label: value,
              type: 'direktörlük',
              orgId: matchingOrg?._id
            });
          });
          
          // Müdürlükler - İlk eşleşeni al
          müdürlükler.forEach(value => {
            const matchingOrg = allOrgs.find((org: any) => org.müdürlük === value);
            orgs.push({
              value: `müdürlük:${value}`,
              label: value,
              type: 'müdürlük',
              orgId: matchingOrg?._id
            });
          });
          
          // Departman/Şeflik - İlk eşleşeni al
          grupLiderlikleri.forEach(value => {
            const matchingOrg = allOrgs.find((org: any) => org.grupLiderligi === value);
            orgs.push({
              value: `grupLiderligi:${value}`,
              label: value,
              type: 'grupLiderligi',
              orgId: matchingOrg?._id
            });
          });
          
          // Pozisyonlar - İlk eşleşeni al
          pozisyonlar.forEach(value => {
            const matchingOrg = allOrgs.find((org: any) => org.pozisyon === value);
            orgs.push({
              value: `pozisyon:${value}`,
              label: value,
              type: 'pozisyon',
              orgId: matchingOrg?._id
            });
          });
          
          setOrganizations(orgs);
          setFilteredOrganizations(orgs); // İlk yüklemede tüm organizasyonları göster
        }
      }
    } catch (error) {
      console.error('❌ Organizasyon yükleme hatası:', error);
    }
  };

  const loadPersons = async () => {
    try {
      const response = await fetch('/api/authorization', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const persons: Person[] = [];
          
          // Tüm kişileri al (aynı isimdeki kişileri de dahil et)
          const authorizations = result.authorizations || [];
          
          // Her kişiyi ekle (isim - sicil no formatında)
          authorizations.forEach((auth: any) => {
            if (auth.personName) {
              const sicilNo = auth.sicilNo || '';
              const label = sicilNo ? `${auth.personName} - ${sicilNo}` : auth.personName;
              const value = sicilNo ? `personName:${auth.personName}:sicilNo:${sicilNo}` : `personName:${auth.personName}`;
              
              persons.push({
                value: value,
                label: label
              });
            }
          });
          
          // Alfabetik sıralama (Türkçe karakter desteği ile) - isme göre
          persons.sort((a, b) => {
            const nameA = a.label.split(' - ')[0];
            const nameB = b.label.split(' - ')[0];
            return nameA.localeCompare(nameB, 'tr');
          });
          
          setPersons(persons);
          setFilteredPersons(persons); // İlk yüklemede tüm kişileri göster
        }
      }
    } catch (error) {
      console.error('❌ Kişi yükleme hatası:', error);
    }
  };

  const loadPersonsForOrganization = async (organizationValue: string) => {
    try {
      // Organizasyon değerini parse et (genelMudurYardimciligi:A -> A)
      const orgType = organizationValue.split(':')[0];
      const orgName = organizationValue.split(':')[1];
      
      // 1. Önce Organization API'sinden pozisyonları bul
      const orgResponse = await fetch('/api/organization', {
        credentials: 'include'
      });
      
      if (!orgResponse.ok) {
        throw new Error(t('errors.organizationListFetch'));
      }
      
      const orgResult = await orgResponse.json();
      
      if (!orgResult.success) {
        throw new Error(orgResult.message || t('errors.organizationListFetch'));
      }
      
      const organizations = orgResult.organizations || [];
      
      // Seçilen organizasyona ait pozisyonları bul
      const matchingOrgs = organizations.filter((org: any) => {
        if (orgType === 'genelMudurYardimciligi') return org.genelMudurYardimciligi === orgName;
        if (orgType === 'direktörlük') return org.direktörlük === orgName;
        if (orgType === 'müdürlük') return org.müdürlük === orgName;
        if (orgType === 'grupLiderligi') return org.grupLiderligi === orgName;
        if (orgType === 'pozisyon') return org.pozisyon === orgName;
        return false;
      });
      
      const orgPositions = matchingOrgs
        .map((org: any) => org.pozisyon)
        .filter(Boolean)
        .filter((position: string, index: number, arr: string[]) => arr.indexOf(position) === index); // Tekrarları kaldır
      
      if (orgPositions.length === 0) {
        return;
      }
      
      // 2. Authorization API'sinden bu pozisyonlara sahip kişileri bul
      const authResponse = await fetch('/api/authorization', {
        credentials: 'include'
      });
      
      if (!authResponse.ok) {
        throw new Error(t('errors.authorizationListFetch'));
      }
      
      const authResult = await authResponse.json();
      
      if (!authResult.success) {
        throw new Error(authResult.message || t('errors.authorizationListFetch'));
      }
      
      const authorizations = authResult.authorizations || [];
      
      // Bu pozisyonlara sahip tüm kişileri bul (tüm kişileri göster, tekrarları kaldırma)
      const matchingPersons = authorizations
        .filter((auth: any) => orgPositions.includes(auth.title))
        .filter((auth: any) => auth.personName); // Sadece personName'i olanları al
      
      // Bu kişileri otomatik olarak seçili kişilere ekle (isim - sicil no formatında)
      const newPersonValues = matchingPersons.map((auth: any) => {
        const sicilNo = auth.sicilNo || '';
        return sicilNo ? `personName:${auth.personName}:sicilNo:${sicilNo}` : `personName:${auth.personName}`;
      });
      const uniqueNewPersons = newPersonValues.filter(personValue => !selectedPersons.includes(personValue));
      
      if (uniqueNewPersons.length > 0) {
        setSelectedPersons(prev => [...prev, ...uniqueNewPersons]);
        setManualPersons(prev => [...prev, ...uniqueNewPersons]);
      }
      
    } catch (error) {
      console.error('❌ Organizasyon kişileri yükleme hatası:', error);
    }
  };

  const removePersonsForOrganization = async (organizationValue: string) => {
    try {
      // Organizasyon değerini parse et (genelMudurYardimciligi:A -> A)
      const orgType = organizationValue.split(':')[0];
      const orgName = organizationValue.split(':')[1];
      
      // 1. Önce Organization API'sinden pozisyonları bul
      const orgResponse = await fetch('/api/organization', {
        credentials: 'include'
      });
      
      if (!orgResponse.ok) {
        throw new Error(t('errors.organizationListFetch'));
      }
      
      const orgResult = await orgResponse.json();
      
      if (!orgResult.success) {
        throw new Error(orgResult.message || t('errors.organizationListFetch'));
      }
      
      const organizations = orgResult.organizations || [];
      
      // Seçilen organizasyona ait pozisyonları bul
      const matchingOrgs = organizations.filter((org: any) => {
        if (orgType === 'genelMudurYardimciligi') return org.genelMudurYardimciligi === orgName;
        if (orgType === 'direktörlük') return org.direktörlük === orgName;
        if (orgType === 'müdürlük') return org.müdürlük === orgName;
        if (orgType === 'grupLiderligi') return org.grupLiderligi === orgName;
        if (orgType === 'pozisyon') return org.pozisyon === orgName;
        return false;
      });
      
      const orgPositions = matchingOrgs
        .map((org: any) => org.pozisyon)
        .filter(Boolean)
        .filter((position: string, index: number, arr: string[]) => arr.indexOf(position) === index); // Tekrarları kaldır
      
      if (orgPositions.length === 0) {
        return;
      }
      
      // 2. Authorization API'sinden bu pozisyonlara sahip kişileri bul
      const authResponse = await fetch('/api/authorization', {
        credentials: 'include'
      });
      
      if (!authResponse.ok) {
        throw new Error(t('errors.authorizationListFetch'));
      }
      
      const authResult = await authResponse.json();
      
      if (!authResult.success) {
        throw new Error(authResult.message || t('errors.authorizationListFetch'));
      }
      
      const authorizations = authResult.authorizations || [];
      
      // Bu pozisyonlara sahip tüm kişileri bul (tüm kişileri göster, tekrarları kaldırma)
      const matchingPersons = authorizations
        .filter((auth: any) => orgPositions.includes(auth.title))
        .filter((auth: any) => auth.personName); // Sadece personName'i olanları al
      
      // Bu kişileri seçili kişiler listesinden kaldır (isim - sicil no formatında)
      const personValuesToRemove = matchingPersons.map((auth: any) => {
        const sicilNo = auth.sicilNo || '';
        return sicilNo ? `personName:${auth.personName}:sicilNo:${sicilNo}` : `personName:${auth.personName}`;
      });
      
      setSelectedPersons(prev => {
        const remainingPersons = prev.filter(personValue => !personValuesToRemove.includes(personValue));
        return remainingPersons;
      });
      
      setManualPersons(prev => {
        const remainingManualPersons = prev.filter(personValue => !personValuesToRemove.includes(personValue));
        return remainingManualPersons;
      });
      
    } catch (error) {
      console.error('❌ Organizasyon kişileri kaldırma hatası:', error);
    }
  };

  const loadPlanets = async () => {
    try {
      // HTML'deki gibi sabit gezegen listesi
      const planets: Planet[] = [
        { value: 'venus', label: `${t('labels.planetVenus')} (${t('competency.uncertainty')} - ${t('competency.customerFocus')})` },
        { value: 'titan', label: `${t('labels.planetTitan')} (${t('competency.ie')} - ${t('competency.idik')})` }
      ];
      setPlanets(planets);
      setFilteredPlanets(planets); // İlk yüklemede tüm gezegenleri göster
    } catch (error) {
      console.error('❌ Gezegen yükleme hatası:', error);
    }
  };

  // Organization search functions
  const handleOrganizationSearch = (searchTerm: string) => {
    setOrganizationSearchTerm(searchTerm);
    if (searchTerm.trim() === '') {
      setFilteredOrganizations(organizations);
    } else {
      // Türkçe karakterleri normalize et
      const normalizeText = (text: string) => {
        return text
          .trim()
          .replace(/İ/g, 'i') // Büyük İ'yi noktasız i'ye çevir
          .replace(/I/g, 'i') // Büyük I'yi noktasız i'ye çevir
          .replace(/Ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/Ş/g, 's') // Ş'yi s'ye çevir
          .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
          .toLowerCase()
          .replace(/i̇/g, 'i') // Noktalı küçük i'yi noktasız i'ye çevir
          .replace(/ı/g, 'i') // Noktasız küçük i'yi noktasız i'ye çevir
          .replace(/ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/ş/g, 's') // Ş'yi s'ye çevir
          .replace(/ü/g, 'u'); // Ü'yi u'ya çevir
      };
      
      const searchNormalized = normalizeText(searchTerm);
      
      const filtered = organizations.filter(org => {
        const labelNormalized = normalizeText(org.label);
        
        // Normalize edilmiş metinlerle karşılaştır
        return labelNormalized.includes(searchNormalized);
      });
      
      setFilteredOrganizations(filtered);
    }
  };

  const handleOrganizationSelect = (orgValue: string) => {
    const selectedOrg = organizations.find(org => org.value === orgValue);
    if (selectedOrg) {
      // Organization ID'sini bul
      let orgId: string | undefined = selectedOrg.orgId;
      
      // Eğer orgId yoksa, allOrganizationsData'dan bul
      if (!orgId && allOrganizationsData.length > 0) {
        const [orgType, orgName] = orgValue.split(':');
        const matchingOrg = allOrganizationsData.find((org: any) => {
          if (orgType === 'genelMudurYardimciligi') return org.genelMudurYardimciligi === orgName;
          if (orgType === 'direktörlük') return org.direktörlük === orgName;
          if (orgType === 'müdürlük') return org.müdürlük === orgName;
          if (orgType === 'grupLiderligi') return org.grupLiderligi === orgName;
          if (orgType === 'pozisyon') return org.pozisyon === orgName;
          return false;
        });
        orgId = matchingOrg?._id;
      }
      
      setSelectedOrganizations(prev => [...prev, orgValue]);
      if (orgId) {
        setSelectedOrganizationIds(prev => [...prev, orgId!]);
      }
      setOrganizationSearchTerm('');
      setShowOrganizationDropdown(false);
      setFilteredOrganizations(organizations); // Reset filter
      
      // Organizasyon seçildiğinde o organizasyona ait kişileri otomatik ekle
      loadPersonsForOrganization(orgValue);
    }
  };

  // Person search functions
  const handlePersonSearch = (searchTerm: string) => {
    setPersonSearchTerm(searchTerm);
    if (searchTerm.trim() === '') {
      setFilteredPersons(persons);
    } else {
      // Türkçe karakterleri normalize et ve büyük/küçük harf farkını kaldır
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .trim()
          .replace(/i̇/g, 'i') // Noktalı küçük i'yi noktasız i'ye çevir
          .replace(/ı/g, 'i') // Noktasız küçük i'yi noktasız i'ye çevir
          .replace(/İ/g, 'i') // Büyük İ'yi noktasız i'ye çevir
          .replace(/I/g, 'i') // Büyük I'yi noktasız i'ye çevir
          .replace(/ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/Ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/ş/g, 's') // Ş'yi s'ye çevir
          .replace(/Ş/g, 's') // Ş'yi s'ye çevir
          .replace(/ü/g, 'u') // Ü'yi u'ya çevir
          .replace(/Ü/g, 'u'); // Ü'yi u'ya çevir
      };
      
      const searchNormalized = normalizeText(searchTerm);
      
      const filtered = persons.filter(person => {
        const labelNormalized = normalizeText(person.label);
        return labelNormalized.includes(searchNormalized);
      });
      
      // Filtrelenmiş sonuçları da alfabetik sırala
      filtered.sort((a, b) => a.label.localeCompare(b.label, 'tr'));
      
      setFilteredPersons(filtered);
    }
  };

  // Person value'dan label'ı bul (isim - sicil no formatında)
  const getPersonLabel = (personValue: string): string => {
    const person = persons.find(p => p.value === personValue);
    if (person) {
      return person.label;
    }
    // Eğer persons listesinde bulunamazsa, value'dan parse et
    if (personValue.includes('sicilNo:')) {
      const parts = personValue.split(':');
      const nameIndex = parts.indexOf('personName');
      const sicilIndex = parts.indexOf('sicilNo');
      if (nameIndex !== -1 && sicilIndex !== -1) {
        const name = parts[nameIndex + 1];
        const sicilNo = parts[sicilIndex + 1];
        return `${name} - ${sicilNo}`;
      }
    } else if (personValue.includes('personName:')) {
      const parts = personValue.split(':');
      const nameIndex = parts.indexOf('personName');
      if (nameIndex !== -1) {
        return parts[nameIndex + 1];
      }
    }
    return personValue;
  };

  const handlePersonSelect = (personValue: string) => {
    const selectedPerson = persons.find(person => person.value === personValue);
    if (selectedPerson) {
      setSelectedPersons(prev => [...prev, personValue]);
      setManualPersons(prev => [...prev, personValue]);
      setPersonSearchTerm('');
      setShowPersonDropdown(false);
      setFilteredPersons(persons); // Reset filter
    }
  };

  // Planet search functions
  const handlePlanetSearch = (searchTerm: string) => {
    setPlanetSearchTerm(searchTerm);
    if (searchTerm.trim() === '') {
      setFilteredPlanets(planets);
    } else {
      // Türkçe karakterleri normalize et
      const normalizeText = (text: string) => {
        return text
          .trim()
          .replace(/İ/g, 'i') // Büyük İ'yi noktasız i'ye çevir
          .replace(/I/g, 'i') // Büyük I'yi noktasız i'ye çevir
          .replace(/Ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/Ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/Ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/Ş/g, 's') // Ş'yi s'ye çevir
          .replace(/Ü/g, 'u') // Ü'yi u'ya çevir
          .toLowerCase()
          .replace(/i̇/g, 'i') // Noktalı küçük i'yi noktasız i'ye çevir
          .replace(/ı/g, 'i') // Noktasız küçük i'yi noktasız i'ye çevir
          .replace(/ç/g, 'c') // Ç'yi c'ye çevir
          .replace(/ğ/g, 'g') // Ğ'yi g'ye çevir
          .replace(/ö/g, 'o') // Ö'yi o'ya çevir
          .replace(/ş/g, 's') // Ş'yi s'ye çevir
          .replace(/ü/g, 'u'); // Ü'yi u'ya çevir
      };
      
      const searchNormalized = normalizeText(searchTerm);
      
      const filtered = planets.filter(planet => {
        const labelNormalized = normalizeText(planet.label);
        return labelNormalized.includes(searchNormalized);
      });
      
      setFilteredPlanets(filtered);
    }
  };

  const handlePlanetSelect = (planetValue: string) => {
    const selectedPlanet = planets.find(planet => planet.value === planetValue);
    if (selectedPlanet) {
      setSelectedPlanets(prev => [...prev, planetValue]);
      setPlanetSearchTerm('');
      setShowPlanetDropdown(false);
      setFilteredPlanets(planets); // Reset filter
    }
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => {
    if (!debouncedSearchTerm) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      group.groupName?.toLowerCase().includes(searchLower) ||
      group.details?.toLowerCase().includes(searchLower) ||
      group.organizations?.some(org => org.toLowerCase().includes(searchLower)) ||
      group.persons?.some(person => person.toLowerCase().includes(searchLower)) ||
      group.planets?.some(planet => planet.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGroups = filteredGroups.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages: JSX.Element[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '8px 12px',
            margin: '0 2px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            backgroundColor: i === currentPage ? '#3B82F6' : 'white',
            color: i === currentPage ? 'white' : '#374151',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: i === currentPage ? '600' : '400'
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: currentPage === 1 ? '#9CA3AF' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {t('buttons.previous')}
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: currentPage === totalPages ? '#9CA3AF' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {t('buttons.next')}
        </button>
      </div>
    );
  };

  const clearForm = () => {
    setFormData({
      groupName: '',
      isActive: true
    });
    setSelectedOrganizations([]);
    setSelectedOrganizationIds([]);
    setSelectedPersons([]);
    setSelectedPlanets([]);
    setManualPersons([]);
    setAutoPersons([]);
    setSelectedGroup(null);
    setOrganizationSearchTerm('');
    setShowOrganizationDropdown(false);
    setFilteredOrganizations(organizations);
    setPersonSearchTerm('');
    setShowPersonDropdown(false);
    setFilteredPersons(persons);
    setPlanetSearchTerm('');
    setShowPlanetDropdown(false);
    setFilteredPlanets(planets);
  };

  const handleAddGroup = () => {
    clearForm();
    setShowAddPopup(true);
  };

  const handleEditGroup = async (group: Group) => {
    try {
      const response = await fetch(`/api/group/${group._id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(t('errors.groupDataFetch'));
      }

      const result = await response.json();
      if (result.success) {
        const groupData = result.group;
        
        // Form alanlarını doldur
        setFormData({
          groupName: groupData.groupName || groupData.name || '',
          isActive: groupData.isActive ?? true
        });
        
        // Seçili öğeleri temizle ve doldur
        setSelectedOrganizations([]);
        setSelectedOrganizationIds([]);
        setSelectedPersons([]);
        setSelectedPlanets([]);
        setManualPersons([]);
        setAutoPersons([]);
        
        // Organizasyonları doldur - Eğer populate edilmişse (object), ID'leri al
        if (groupData.organizations && groupData.organizations.length > 0) {
          const orgIds: string[] = [];
          const orgValues: string[] = [];
          
          groupData.organizations.forEach((org: any) => {
            if (typeof org === 'string') {
              // Eski format (string) - backward compatibility
              orgValues.push(org);
            } else if (org._id) {
              // Yeni format (populated object) - ID'yi al
              orgIds.push(org._id);
              // Display için string formatını oluştur
              if (org.genelMudurYardimciligi && org.genelMudurYardimciligi !== '-') {
                orgValues.push(`genelMudurYardimciligi:${org.genelMudurYardimciligi}`);
              } else if (org.direktörlük && org.direktörlük !== '-') {
                orgValues.push(`direktörlük:${org.direktörlük}`);
              } else if (org.müdürlük && org.müdürlük !== '-') {
                orgValues.push(`müdürlük:${org.müdürlük}`);
              } else if (org.grupLiderligi && org.grupLiderligi !== '-') {
                orgValues.push(`grupLiderligi:${org.grupLiderligi}`);
              } else if (org.pozisyon) {
                orgValues.push(`pozisyon:${org.pozisyon}`);
              }
            }
          });
          
          setSelectedOrganizationIds(orgIds);
          setSelectedOrganizations(orgValues.length > 0 ? orgValues : groupData.organizations);
        }
        
        // Kişileri doldur - hepsini manuel olarak işaretle (düzenleme modunda)
        if (groupData.persons && groupData.persons.length > 0) {
          setSelectedPersons([...groupData.persons]);
          setManualPersons([...groupData.persons]); // Düzenleme modunda hepsi manuel
        }
        
        // Gezegenleri doldur
        if (groupData.planets && groupData.planets.length > 0) {
          setSelectedPlanets([...groupData.planets]);
        }
        
        // Düzenlenen grubu sakla
        setSelectedGroup(groupData);
        
        // Reset search states
        setOrganizationSearchTerm('');
        setShowOrganizationDropdown(false);
        setFilteredOrganizations(organizations);
        setPersonSearchTerm('');
        setShowPersonDropdown(false);
        setFilteredPersons(persons);
        setPlanetSearchTerm('');
        setShowPlanetDropdown(false);
        setFilteredPlanets(planets);
        
        // Modal başlığını değiştir (edit mode)
        setShowEditPopup(true);
      } else {
        throw new Error(result.message || t('errors.groupDataFetch'));
      }
    } catch (error) {
      console.error('Grup verileri alma hatası:', error);
      setErrorMessage(`${t('errors.groupDataFetch')}: ${(error as Error).message}`);
      setShowErrorPopup(true);
    }
  };

  const handleDeleteGroup = (group: Group) => {
    setSelectedGroup(group);
    setShowDeletePopup(true);
  };

  // Checkbox seçim fonksiyonları
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleGroups = filteredGroups;
    if (selectedItems.length === visibleGroups.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(visibleGroups.map(group => group._id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      setErrorMessage(t('errors.selectGroupToDelete'));
      setShowErrorPopup(true);
      return;
    }
    setShowBulkDeletePopup(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsSubmitting(true);
      // Her bir grubu tek tek sil
      const deletePromises = selectedItems.map(id => {
        return fetch(`/api/group/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      });
      
      const responses = await Promise.all(deletePromises);
      
      // Tüm silme işlemlerinin başarılı olduğunu kontrol et
      const failedDeletes = responses.filter(response => !response.ok);
      if (failedDeletes.length > 0) {
        throw new Error(`${failedDeletes.length} grup silinemedi`);
      }

      // Başarılı silme sonrası
      setShowBulkDeletePopup(false);
      setSelectedItems([]);
      
      // Veriyi yeniden yükle
      await loadGroups();
      
      setSuccessMessage(formatBulkDeleteSuccess(selectedItems.length));
      setShowSuccessPopup(true);
    } catch (error: any) {
      console.error('Toplu silme hatası:', error);
      setErrorMessage(error.message || t('errors.bulkDeleteFailed'));
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowDetailsPopup(true);
  };

  const handleSaveGroup = async () => {
    if (isSubmitting) return;

    // Grup adı kontrolü
    const groupName = formData.groupName.trim();
    if (!groupName) {
      setErrorMessage(t('errors.enterGroupName'));
      setShowErrorPopup(true);
      return;
    }

    // Organizasyon veya Kişi kontrolü - En az biri dolu olmalı
    if (selectedOrganizations.length === 0 && selectedPersons.length === 0) {
      setErrorMessage(t('errors.selectOrgOrPerson'));
      setShowErrorPopup(true);
      return;
    }

    // Gezegen kontrolü - ZORUNLU
    if (selectedPlanets.length === 0) {
      setErrorMessage(t('errors.selectPlanet'));
      setShowErrorPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const groupData = {
        name: groupName, // Backend 'name' alanını bekliyor
        status: formData.isActive ? 'Aktif' : 'Pasif', // Backend 'Aktif'/'Pasif' bekliyor
        organizations: selectedOrganizationIds.length > 0 ? selectedOrganizationIds : selectedOrganizations, // ID varsa ID gönder, yoksa string gönder (backward compatibility)
        persons: selectedPersons,
        planets: selectedPlanets
      };


      const url = selectedGroup ? `/api/group/${selectedGroup._id}` : '/api/group';
      const method = selectedGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(selectedGroup ? t('messages.groupUpdated') : t('messages.groupCreated'));
        setShowSuccessPopup(true);
        setShowAddPopup(false);
        setShowEditPopup(false);
        clearForm(); // Formu temizle
        loadGroups();
      } else {
        throw new Error(result.message || t('errors.groupSaveFailed'));
      }
    } catch (error: any) {
      console.error('❌ Grup kaydetme hatası:', error);
      // Backend'den gelen hata mesajını göster
      const errorMessage = error.message || t('errors.groupSaveError');
      setErrorMessage(errorMessage);
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/group/${selectedGroup._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(t('messages.groupDeleted'));
        setShowSuccessPopup(true);
        setShowDeletePopup(false);
        loadGroups();
      } else {
        throw new Error(result.message || t('errors.groupDeleteFailed'));
      }
    } catch (error) {
      console.error('❌ Grup silme hatası:', error);
      setErrorMessage(t('errors.groupDeleteError'));
      setShowErrorPopup(true);
    }
  };

  const addOrganization = async () => {
    // Yeni arama sistemi için - eğer arama terimi varsa ve tek sonuç varsa onu seç
    if (organizationSearchTerm.trim() !== '') {
      const exactMatch = filteredOrganizations.find(org => 
        org.label.toLowerCase() === organizationSearchTerm.toLowerCase()
      );
      if (exactMatch) {
        handleOrganizationSelect(exactMatch.value);
        return;
      }
    }

    // Eski sistem için fallback
    const select = document.getElementById('organizationSelect') as HTMLSelectElement;
    const selectedValue = select.value;

    if (!selectedValue) {
      setErrorMessage(t('errors.selectOrganization'));
      setShowErrorPopup(true);
      return;
    }

    if (selectedOrganizations.includes(selectedValue)) {
      setErrorMessage(t('errors.organizationAlreadySelected'));
      setShowErrorPopup(true);
      return;
    }

    const newOrganizations = [...selectedOrganizations, selectedValue];
    setSelectedOrganizations(newOrganizations);
    select.value = '';
    
    // Eşleşen kişileri otomatik ekle (güncellenmiş organizasyon listesi ile)
    await addMatchingPersonsForOrganizations(newOrganizations);
  };

  const removeOrganization = async (orgValue: string) => {
    // Önce organizasyonu listeden kaldır
    const newOrganizations = selectedOrganizations.filter(org => org !== orgValue);
    setSelectedOrganizations(newOrganizations);
    
    // ID'yi de kaldır
    const selectedOrg = organizations.find(org => org.value === orgValue);
    if (selectedOrg && selectedOrg.orgId) {
      setSelectedOrganizationIds(prev => prev.filter(id => id !== selectedOrg.orgId));
    }
    
    // Kaldırılan organizasyona ait kişileri bul ve kaldır
    await removePersonsForOrganization(orgValue);
    
    // Eski API endpoint'i kullanmayı bırak, yeni mantıkla çalışıyoruz
    // await updateMatchingPersonsForOrganizations(newOrganizations);
  };

  // Eşleşen kişileri otomatik ekle (belirli organizasyon listesi ile)
  const addMatchingPersonsForOrganizations = async (organizations: string[]) => {
    // Organizasyon seçilmemişse otomatik kişi ekleme yapma
    if (organizations.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/group/matching-persons', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizations: organizations
        })
      });

      if (!response.ok) {
        throw new Error(t('errors.matchingPersonsFetch'));
      }

      const result = await response.json();
      
      if (result.success && result.persons && result.persons.length > 0) {
        // Yeni kişileri ekle (zaten var olanları atla)
        let addedCount = 0;
        const newPersons = [...selectedPersons];
        const newAutoPersons = [...autoPersons];
        
        result.persons.forEach((person: any) => {
          if (!selectedPersons.includes(person.value)) {
            newPersons.push(person.value);
            newAutoPersons.push(person.value); // Otomatik eklenen olarak işaretle
            addedCount++;
          }
        });
        
        if (addedCount > 0) {
          setSelectedPersons(newPersons);
          setAutoPersons(newAutoPersons);
          
          // Detaylı bilgi göster
          const positionCount = result.positions ? result.positions.length : 0;
          setSuccessMessage(formatAutoPersonsAdded(addedCount, positionCount));
          setShowSuccessPopup(true);
        }
      } else if (result.success && result.persons.length === 0) {
        // Pozisyon bulunamadı mesajı
        setSuccessMessage(result.message || t('messages.noMatchingPositions'));
        setShowSuccessPopup(true);
      }
    } catch (error) {
      console.error('Eşleşen kişileri alma hatası:', error);
      // Hata durumunda sessizce devam et, kullanıcıyı rahatsız etme
    }
  };

  // Organizasyon değişikliklerinde eşleşen kişileri güncelle (belirli organizasyon listesi ile)
  const updateMatchingPersonsForOrganizations = async (organizations: string[]) => {
    try {
      // Eğer organizasyon yoksa, sadece manuel eklenen kişileri tut
      if (organizations.length === 0) {
        // Otomatik eklenen kişileri temizle, manuel eklenenleri koru
        setAutoPersons([]);
        setSelectedPersons([...manualPersons]);
        return;
      }

      const response = await fetch('/api/group/matching-persons', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizations: organizations
        })
      });

      if (!response.ok) {
        throw new Error(t('errors.matchingPersonsFetch'));
      }

      const result = await response.json();
      if (result.success) {
        // Otomatik eklenen kişileri temizle
        setAutoPersons([]);
        
        // Manuel eklenen kişileri koru, otomatik eklenenleri güncelle
        const newPersons = [...manualPersons];
        const newAutoPersons: string[] = [];
        
        // Yeni eşleşen kişileri ekle
        if (result.persons && result.persons.length > 0) {
          result.persons.forEach((person: any) => {
            if (!newPersons.includes(person.value)) {
              newPersons.push(person.value);
              newAutoPersons.push(person.value);
            }
          });
        }
        
        setSelectedPersons(newPersons);
        setAutoPersons(newAutoPersons);
      }
    } catch (error) {
      // Hata durumunda sessizce devam et, kullanıcıyı rahatsız etme
    }
  };


  const addPerson = () => {
    // Yeni arama sistemi için - eğer arama terimi varsa ve tek sonuç varsa onu seç
    if (personSearchTerm.trim() !== '') {
      // Türkçe karakterleri normalize et
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .trim()
          .replace(/i̇/g, 'i')
          .replace(/ı/g, 'i')
          .replace(/İ/g, 'i')
          .replace(/I/g, 'i')
          .replace(/ç/g, 'c')
          .replace(/Ç/g, 'c')
          .replace(/ğ/g, 'g')
          .replace(/Ğ/g, 'g')
          .replace(/ö/g, 'o')
          .replace(/Ö/g, 'o')
          .replace(/ş/g, 's')
          .replace(/Ş/g, 's')
          .replace(/ü/g, 'u')
          .replace(/Ü/g, 'u');
      };
      
      const searchNormalized = normalizeText(personSearchTerm);
      const exactMatch = filteredPersons.find(person => 
        normalizeText(person.label) === searchNormalized
      );
      if (exactMatch) {
        handlePersonSelect(exactMatch.value);
        return;
      }
    }

    // Eski sistem için fallback
    const select = document.getElementById('personSelect') as HTMLSelectElement;
    const selectedValue = select.value;
    
    if (!selectedValue) {
      setErrorMessage('Lütfen bir kişi seçin!');
      setShowErrorPopup(true);
      return;
    }

    if (selectedPersons.includes(selectedValue)) {
      setErrorMessage('Bu kişi zaten seçilmiş!');
      setShowErrorPopup(true);
      return;
    }

    setSelectedPersons([...selectedPersons, selectedValue]);
    setManualPersons([...manualPersons, selectedValue]);
    select.value = '';
  };

  const removePerson = (personValue: string) => {
    setSelectedPersons(selectedPersons.filter(person => person !== personValue));
    setManualPersons(manualPersons.filter(person => person !== personValue));
    setAutoPersons(autoPersons.filter(person => person !== personValue));
  };

  const addPlanet = () => {
    const select = document.getElementById('planetSelect') as HTMLSelectElement;
    const selectedValue = select.value;
    
    if (!selectedValue) {
      setErrorMessage('Lütfen bir gezegen seçin!');
      setShowErrorPopup(true);
      return;
    }

    if (selectedPlanets.includes(selectedValue)) {
      setErrorMessage('Bu gezegen zaten seçilmiş!');
      setShowErrorPopup(true);
      return;
    }

    setSelectedPlanets([...selectedPlanets, selectedValue]);
    select.value = '';
  };

  const removePlanet = (planetValue: string) => {
    setSelectedPlanets(selectedPlanets.filter(planet => planet !== planetValue));
  };


  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#FEF3C7', fontWeight: '600' }}>
          {part}
        </span>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6B7280', fontSize: '16px' }}>{t('labels.groupsLoading')}</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      background: '#F8F9FA',
      minHeight: '100vh',
      padding: '24px 32px 0 10px'
    }}>
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
            {t('titles.grouping')}
          </div>
        </div>
      </div>

      {/* Tab Container */}
      <div style={{
        display: 'flex',
        gap: '30px',
        marginBottom: '20px'
      }}>
        <div style={{
          flex: 1,
          padding: '16px',
          borderRadius: '6px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#E5E7EB',
          color: '#6B7280',
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: '20px'
        }}
        onClick={() => navigate('/organization')}>
          {t('titles.organization')}
        </div>
        <div style={{
          flex: 1,
          padding: '16px',
          borderRadius: '6px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#3A57E8',
          color: 'white',
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: '20px'
        }}>
          {t('titles.grouping')}
        </div>
        <div style={{
          flex: 1,
          padding: '16px',
          borderRadius: '6px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#E5E7EB',
          color: '#6B7280',
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: '20px'
        }}
        onClick={() => navigate('/authorization')}>
          {t('titles.authorization')}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          {isSearching ? (
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #E5E7EB',
                borderTop: '2px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : (
            <i className="fas fa-search" style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280',
              fontSize: '16px',
              zIndex: 1
            }} />
          )}
          <input
            type="text"
            placeholder={t('placeholders.groupSearch')}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
            }}
            onInput={(e) => {
              // onInput event'i daha güvenilir
              const value = (e.target as HTMLInputElement).value;
              setSearchTerm(value);
            }}
            onKeyDown={(e) => {
              // Tüm metni seçip silme durumunu yakala
              if (e.key === 'Delete' || e.key === 'Backspace') {
                const input = e.target as HTMLInputElement;
                if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                  setSearchTerm('');
                }
              }
            }}
            onKeyUp={(e) => {
              // Ctrl+A + Delete/Backspace kombinasyonunu yakala
              const input = e.target as HTMLInputElement;
              if (input.value === '') {
                setSearchTerm('');
              }
            }}
            style={{
              padding: '12px 16px 12px 48px',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '14px',
              width: '350px',
              outline: 'none',
              backgroundColor: '#FAFAFA',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter',
              fontWeight: '500'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
              e.target.style.backgroundColor = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.backgroundColor = '#FAFAFA';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#F3F4F6';
                (e.target as HTMLButtonElement).style.color = '#6B7280';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.target as HTMLButtonElement).style.color = '#9CA3AF';
              }}
            >
              ×
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{
                backgroundColor: '#DC3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-trash"></i>
              {t('labels.bulkDelete')} ({selectedItems.length})
            </button>
          )}
          <button
            onClick={handleAddGroup}
            style={{
              backgroundColor: '#3A57E8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('buttons.addGroup')}
          </button>
        </div>
      </div>


      {/* Groups Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1F2937',
            margin: '0'
          }}>
            {t('labels.groups')} ({filteredGroups.length})
          </h3>
        </div>

        {currentGroups.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <p style={{ fontSize: '16px', margin: '0' }}>
              {searchTerm ? t('labels.groupsNotFound') : t('labels.groupsEmpty')}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA' }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 700,
                      width: '50px'
                    }}>
                      <label style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.length > 0 && selectedItems.length === filteredGroups.length}
                          onChange={handleSelectAll}
                          style={{
                            opacity: 0,
                            position: 'absolute',
                            cursor: 'pointer',
                            height: 0,
                            width: 0
                          }}
                        />
                        <span style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '18px',
                          height: '18px',
                          backgroundColor: selectedItems.length > 0 && selectedItems.length === filteredGroups.length ? '#0286F7' : 'white',
                          border: `2px solid ${selectedItems.length > 0 && selectedItems.length === filteredGroups.length ? '#0286F7' : '#E9ECEF'}`,
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          transform: selectedItems.length > 0 && selectedItems.length === filteredGroups.length ? 'scale(1.1)' : 'scale(1)'
                        }}>
                          {selectedItems.length > 0 && selectedItems.length === filteredGroups.length && (
                            <span style={{
                              position: 'absolute',
                              display: 'block',
                              left: '4px',
                              top: '1px',
                              width: '6px',
                              height: '10px',
                              border: 'solid white',
                              borderWidth: '0 2px 2px 0',
                              transform: 'rotate(40deg)'
                            }} />
                          )}
                        </span>
                      </label>
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 700
                    }}>
                      {t('labels.groupName')}
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 700
                    }}>
                      {t('labels.status')}
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 700
                    }}>
                      {t('labels.details')}
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'right',
                      color: '#232D42',
                      fontSize: '14px',
                      fontFamily: 'Montserrat',
                      fontWeight: 700
                    }}>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchTerm && (
                    <tr>
                      <td colSpan={5} style={{
                        padding: '12px 16px',
                        backgroundColor: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        fontSize: '13px',
                        color: '#64748B',
                        fontFamily: 'Inter',
                        fontWeight: '500'
                      }}>
                        🔍 {formatSearchResultsCount(debouncedSearchTerm, filteredGroups.length)}
                      </td>
                    </tr>
                  )}
                  {currentGroups.map((group) => (
                    <tr key={group._id} style={{
                      borderBottom: '1px solid #E9ECEF',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(2, 134, 247, 0.10)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'white';
                    }}>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <label style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(group._id)}
                            onChange={() => handleSelectItem(group._id)}
                            style={{
                              opacity: 0,
                              position: 'absolute',
                              cursor: 'pointer',
                              height: 0,
                              width: 0
                            }}
                          />
                          <span style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '18px',
                            height: '18px',
                            backgroundColor: selectedItems.includes(group._id) ? '#0286F7' : 'white',
                            border: `2px solid ${selectedItems.includes(group._id) ? '#0286F7' : '#E9ECEF'}`,
                            borderRadius: '4px',
                            transition: 'all 0.3s ease',
                            transform: selectedItems.includes(group._id) ? 'scale(1.1)' : 'scale(1)'
                          }}>
                            {selectedItems.includes(group._id) && (
                              <span style={{
                                position: 'absolute',
                                display: 'block',
                                left: '4px',
                                top: '1px',
                                width: '6px',
                                height: '10px',
                                border: 'solid white',
                                borderWidth: '0 2px 2px 0',
                                transform: 'rotate(40deg)'
                              }} />
                            )}
                          </span>
                        </label>
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#232D42',
                        fontSize: '14px',
                        fontFamily: 'Montserrat',
                        fontWeight: 500
                      }}>
                        {highlightText(group.groupName || group.name || '', debouncedSearchTerm)}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#232D42',
                        fontSize: '14px',
                        fontFamily: 'Montserrat',
                        fontWeight: 500
                      }}>
                        {group.isActive ? t('status.active') : t('status.passive')}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#232D42',
                        fontSize: '14px',
                        fontFamily: 'Montserrat',
                        fontWeight: 500
                      }}>
                        <button
                          onClick={() => handleViewDetails(group)}
                          style={{
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background-color 0.3s'
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#138496';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#17a2b8';
                          }}
                        >
                          <i className="fas fa-eye"></i>
                          {t('buttons.viewGroupDetails')}
                        </button>
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right'
                      }}>
                        <i 
                          className="fas fa-edit" 
                          style={{
                            color: '#0286F7',
                            marginRight: '16px',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                          onClick={() => handleEditGroup(group)}
                        />
                        <i 
                          className="fas fa-trash" 
                          style={{
                            color: '#A30D11',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                          onClick={() => handleDeleteGroup(group)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </>
        )}
      </div>

      {/* Add Group Popup */}
      {showAddPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '0',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 0 24px',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#EBF4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-plus" style={{ color: '#3B82F6', fontSize: '18px' }}></i>
                </div>
                <div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1F2937',
                    margin: '0'
                  }}>
                    {t('buttons.addGroup')}
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    margin: '4px 0 0 0'
                  }}>
                    {t('labels.createGroupDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              {/* Group Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('labels.groupName')} *
                </label>
                <input
                  type="text"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder={t('placeholders.groupName')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#3B82F6';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#E5E7EB';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Group Status */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('labels.status')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#8A92A6', fontSize: '16px' }}>{t('status.passive')}</span>
                  <div 
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    style={{
                      width: '38px',
                      height: '20px',
                      backgroundColor: formData.isActive ? '#3A57E8' : '#D9D9D9',
                      borderRadius: '39px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      width: '15px',
                      height: '15px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      top: '2.5px',
                      left: formData.isActive ? '20.5px' : '2.5px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                  <span style={{ color: '#8A92A6', fontSize: '16px' }}>{t('status.active')}</span>
                </div>
              </div>

              {/* Organizations */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('titles.organization')} *
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} data-organization-dropdown>
                    <input
                      type="text"
                      value={organizationSearchTerm}
                      onChange={(e) => {
                        handleOrganizationSearch(e.target.value);
                        setShowOrganizationDropdown(true);
                      }}
                      onFocus={() => setShowOrganizationDropdown(true)}
                      placeholder={
                        language === 'en'
                          ? `${t('labels.organizationSearchPlaceholder')} (${organizations.length - selectedOrganizations.length} available)`
                          : `${t('labels.organizationSearchPlaceholder')} (${organizations.length - selectedOrganizations.length} organizasyon mevcut)`
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                    {showOrganizationDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {Object.entries(filteredOrganizations
                          .filter(org => !selectedOrganizations.includes(org.value))
                          .reduce((acc: { [key: string]: Organization[] }, org) => {
                            if (!acc[org.type]) acc[org.type] = [];
                            acc[org.type].push(org);
                            return acc;
                          }, {}))
                          .map(([type, orgs]) => (
                            <div key={type}>
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: '#F3F4F6',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#6B7280',
                                borderBottom: '1px solid #E5E7EB'
                              }}>
                                {type === 'genelMudurYardimciligi' ? 'Genel Müdür Yardımcılıkları' :
                                  type === 'direktörlük' ? 'Direktörlükler' :
                                  type === 'müdürlük' ? 'Müdürlükler' :
                                  type === 'grupLiderligi' ? 'Departman/Şeflik' :
                                  'Pozisyonlar'}
                              </div>
                              {orgs.map(org => (
                                <div
                                  key={org.value}
                                  onClick={() => handleOrganizationSelect(org.value)}
                                  style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#374151',
                                    borderBottom: '1px solid #F3F4F6'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }}
                                >
                                  {org.label}
                                </div>
                              ))}
                            </div>
                          ))}
                        {filteredOrganizations.filter(org => !selectedOrganizations.includes(org.value)).length === 0 && (
                          <div style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '14px'
                          }}>
                            {t('labels.organizationNotFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB'
                }}>
                  {selectedOrganizations.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
                      {t('labels.noOrganizationSelected')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedOrganizations.map(org => (
                        <span
                          key={org}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#EBF4FF',
                            color: '#1E40AF',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {org.split(':')[1]}
                          <button
                            onClick={() => removeOrganization(org)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#1E40AF',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Persons */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('titles.authorization')} *
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} data-person-dropdown>
                    <input
                      type="text"
                      value={personSearchTerm}
                      onChange={(e) => {
                        handlePersonSearch(e.target.value);
                        setShowPersonDropdown(true);
                      }}
                      onFocus={() => setShowPersonDropdown(true)}
                      placeholder={
                        language === 'en'
                          ? `${t('labels.personSearchPlaceholder')} (${persons.length - selectedPersons.length} available)`
                          : `${t('labels.personSearchPlaceholder')} (${persons.length - selectedPersons.length} kişi mevcut)`
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                    {showPersonDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {filteredPersons
                          .filter(person => !selectedPersons.includes(person.value))
                          .map(person => (
                            <div
                              key={person.value}
                              onClick={() => handlePersonSelect(person.value)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#374151',
                                borderBottom: '1px solid #F3F4F6'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                              }}
                            >
                              {person.label}
                            </div>
                          ))}
                        {filteredPersons.filter(person => !selectedPersons.includes(person.value)).length === 0 && (
                          <div style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '14px'
                          }}>
                            {t('labels.personNotFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB'
                }}>
                  {selectedPersons.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
                      {t('labels.noPersonSelected')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPersons.map(person => (
                        <span
                          key={person}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: autoPersons.includes(person) ? '#D1FAE5' : '#EBF4FF',
                            color: autoPersons.includes(person) ? '#065F46' : '#1E40AF',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {getPersonLabel(person)}
                          {autoPersons.includes(person) && (
                            <i className="fas fa-magic" style={{ fontSize: '8px' }}></i>
                          )}
                          <button
                            onClick={() => removePerson(person)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: autoPersons.includes(person) ? '#065F46' : '#1E40AF',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Planets */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('labels.planets')}
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} data-planet-dropdown>
                    <input
                      type="text"
                      value={planetSearchTerm}
                      onChange={(e) => {
                        handlePlanetSearch(e.target.value);
                        setShowPlanetDropdown(true);
                      }}
                      onFocus={() => setShowPlanetDropdown(true)}
                      placeholder={
                        language === 'en'
                          ? `${t('labels.planetSearchPlaceholder')} (${planets.length - selectedPlanets.length} available)`
                          : `${t('labels.planetSearchPlaceholder')} (${planets.length - selectedPlanets.length} gezegen mevcut)`
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                    {showPlanetDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {filteredPlanets
                          .filter(planet => !selectedPlanets.includes(planet.value))
                          .map(planet => (
                            <div
                              key={planet.value}
                              onClick={() => handlePlanetSelect(planet.value)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#374151',
                                borderBottom: '1px solid #F3F4F6'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                              }}
                            >
                              {planet.label}
                            </div>
                          ))}
                        {filteredPlanets.filter(planet => !selectedPlanets.includes(planet.value)).length === 0 && (
                          <div style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '14px'
                          }}>
                            {t('labels.planetNotFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB'
                }}>
                  {selectedPlanets.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
                      {t('labels.noPlanetSelected')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPlanets.map(planet => (
                        <span
                          key={planet}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {(() => {
                            const planetObj = planets.find(p => p.value === planet);
                            return planetObj ? planetObj.label : planet;
                          })()}
                          <button
                            onClick={() => removePlanet(planet)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#92400E',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowAddPopup(false);
                  clearForm();
                }}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.borderColor = '#E5E7EB';
                  }
                }}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isSubmitting ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#3B82F6';
                  }
                }}
              >
                {isSubmitting && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #E5E7EB',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {isSubmitting ? t('statuses.saving') : t('buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Popup - Similar structure to Add Popup */}
      {showEditPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '0',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 0 24px',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#EBF4FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-edit" style={{ color: '#3B82F6', fontSize: '18px' }}></i>
                </div>
                <div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1F2937',
                    margin: '0'
                  }}>
                    {t('titles.editGroup')}
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    margin: '4px 0 0 0'
                  }}>
                    {t('labels.groupDetailsSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Same as Add Popup */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              {/* Group Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('labels.groupName')} *
                </label>
                <input
                  type="text"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder={t('placeholders.groupName')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#3B82F6';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = '#E5E7EB';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Group Status */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('labels.status')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#8A92A6', fontSize: '16px' }}>{t('status.passive')}</span>
                  <div 
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    style={{
                      width: '38px',
                      height: '20px',
                      backgroundColor: formData.isActive ? '#3A57E8' : '#D9D9D9',
                      borderRadius: '39px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      width: '15px',
                      height: '15px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      top: '2.5px',
                      left: formData.isActive ? '20.5px' : '2.5px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                  <span style={{ color: '#8A92A6', fontSize: '16px' }}>{t('status.active')}</span>
                </div>
              </div>

              {/* Organizations - Same as Add Popup */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('titles.organization')} *
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} data-organization-dropdown>
                    <input
                      type="text"
                      value={organizationSearchTerm}
                      onChange={(e) => {
                        handleOrganizationSearch(e.target.value);
                        setShowOrganizationDropdown(true);
                      }}
                      onFocus={() => setShowOrganizationDropdown(true)}
                      placeholder={
                        language === 'en'
                          ? `${t('labels.organizationSearchPlaceholder')} (${organizations.length - selectedOrganizations.length} available)`
                          : `${t('labels.organizationSearchPlaceholder')} (${organizations.length - selectedOrganizations.length} organizasyon mevcut)`
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                    {showOrganizationDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {Object.entries(filteredOrganizations
                          .filter(org => !selectedOrganizations.includes(org.value))
                          .reduce((acc: { [key: string]: Organization[] }, org) => {
                            if (!acc[org.type]) acc[org.type] = [];
                            acc[org.type].push(org);
                            return acc;
                          }, {}))
                          .map(([type, orgs]) => (
                            <div key={type}>
                              <div style={{
                                padding: '8px 12px',
                                backgroundColor: '#F3F4F6',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#6B7280',
                                borderBottom: '1px solid #E5E7EB'
                              }}>
                                {type === 'genelMudurYardimciligi' ? 'Genel Müdür Yardımcılıkları' :
                                  type === 'direktörlük' ? 'Direktörlükler' :
                                  type === 'müdürlük' ? 'Müdürlükler' :
                                  type === 'grupLiderligi' ? 'Departman/Şeflik' :
                                  'Pozisyonlar'}
                              </div>
                              {orgs.map(org => (
                                <div
                                  key={org.value}
                                  onClick={() => handleOrganizationSelect(org.value)}
                                  style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#374151',
                                    borderBottom: '1px solid #F3F4F6'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }}
                                >
                                  {org.label}
                                </div>
                              ))}
                            </div>
                          ))}
                        {filteredOrganizations.filter(org => !selectedOrganizations.includes(org.value)).length === 0 && (
                          <div style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '14px'
                          }}>
                            {t('labels.organizationNotFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB'
                }}>
                  {selectedOrganizations.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
                      {t('labels.noOrganizationSelected')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedOrganizations.map(org => (
                        <span
                          key={org}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#EBF4FF',
                            color: '#1E40AF',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {org.split(':')[1]}
                          <button
                            onClick={() => removeOrganization(org)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#1E40AF',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Persons - Same as Add Popup */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('titles.authorization')} *
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} data-person-dropdown>
                    <input
                      type="text"
                      value={personSearchTerm}
                      onChange={(e) => {
                        handlePersonSearch(e.target.value);
                        setShowPersonDropdown(true);
                      }}
                      onFocus={() => setShowPersonDropdown(true)}
                      placeholder={
                        language === 'en'
                          ? `${t('labels.personSearchPlaceholder')} (${persons.length - selectedPersons.length} available)`
                          : `${t('labels.personSearchPlaceholder')} (${persons.length - selectedPersons.length} kişi mevcut)`
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                    {showPersonDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {filteredPersons
                          .filter(person => !selectedPersons.includes(person.value))
                          .map(person => (
                            <div
                              key={person.value}
                              onClick={() => handlePersonSelect(person.value)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#374151',
                                borderBottom: '1px solid #F3F4F6'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                              }}
                            >
                              {person.label}
                            </div>
                          ))}
                        {filteredPersons.filter(person => !selectedPersons.includes(person.value)).length === 0 && (
                          <div style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '14px'
                          }}>
                            {t('labels.personNotFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB'
                }}>
                  {selectedPersons.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
                      {t('labels.noPersonSelected')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPersons.map(person => (
                        <span
                          key={person}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: autoPersons.includes(person) ? '#D1FAE5' : '#EBF4FF',
                            color: autoPersons.includes(person) ? '#065F46' : '#1E40AF',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {getPersonLabel(person)}
                          {autoPersons.includes(person) && (
                            <i className="fas fa-magic" style={{ fontSize: '8px' }}></i>
                          )}
                          <button
                            onClick={() => removePerson(person)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: autoPersons.includes(person) ? '#065F46' : '#1E40AF',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Planets - Same as Add Popup */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('labels.planets')}
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} data-planet-dropdown>
                    <input
                      type="text"
                      value={planetSearchTerm}
                      onChange={(e) => {
                        handlePlanetSearch(e.target.value);
                        setShowPlanetDropdown(true);
                      }}
                      onFocus={() => setShowPlanetDropdown(true)}
                      placeholder={
                        language === 'en'
                          ? `${t('labels.planetSearchPlaceholder')} (${planets.length - selectedPlanets.length} available)`
                          : `${t('labels.planetSearchPlaceholder')} (${planets.length - selectedPlanets.length} gezegen mevcut)`
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                    {showPlanetDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {filteredPlanets
                          .filter(planet => !selectedPlanets.includes(planet.value))
                          .map(planet => (
                            <div
                              key={planet.value}
                              onClick={() => handlePlanetSelect(planet.value)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#374151',
                                borderBottom: '1px solid #F3F4F6'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                              }}
                            >
                              {planet.label}
                            </div>
                          ))}
                        {filteredPlanets.filter(planet => !selectedPlanets.includes(planet.value)).length === 0 && (
                          <div style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '14px'
                          }}>
                            {t('labels.planetNotFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB'
                }}>
                  {selectedPlanets.length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0', fontStyle: 'italic' }}>
                      {t('labels.noPlanetSelected')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPlanets.map(planet => (
                        <span
                          key={planet}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {(() => {
                            const planetObj = planets.find(p => p.value === planet);
                            return planetObj ? planetObj.label : planet;
                          })()}
                          <button
                            onClick={() => removePlanet(planet)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#92400E',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowEditPopup(false);
                  clearForm();
                }}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.borderColor = '#E5E7EB';
                  }
                }}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isSubmitting ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#3B82F6';
                  }
                }}
              >
                {isSubmitting && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #E5E7EB',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {isSubmitting ? t('statuses.updating') : t('buttons.updateGroup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Popup */}
      {showDetailsPopup && selectedGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#28a745',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white'
              }}>
                <i className="fas fa-info-circle"></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#232D42',
                margin: 0
              }}>
                {selectedGroup.groupName || selectedGroup.name} - {t('labels.details')}
              </h3>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                marginBottom: '20px'
              }}>
                <h4 style={{
                  color: '#232D42',
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  borderBottom: '2px solid #3A57E8',
                  paddingBottom: '5px'
                }}>
                  {t('labels.groupInfo')}
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#E9ECEF',
                    color: '#495057',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {t('labels.status')}: {selectedGroup.isActive ? t('status.active') : t('status.passive')}
                  </span>
                  <span style={{
                    background: '#E9ECEF',
                    color: '#495057',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {t('labels.createdAt')}: {new Date(selectedGroup.createdAt || Date.now()).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}
                  </span>
                </div>
              </div>

              {/* Organizasyonlar */}
              {selectedGroup.organizations && selectedGroup.organizations.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    color: '#232D42',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '10px',
                    borderBottom: '2px solid #3A57E8',
                    paddingBottom: '5px'
                  }}>
                    {t('titles.organization')} ({selectedGroup.organizations.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {selectedGroup.organizations.map((org: any, index) => {
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
                          displayValue = t('labels.unknown');
                        }
                      } else {
                        // String format (eski format veya populate edilmemiş)
                        const orgString = typeof org === 'string' ? org : String(org);
                        displayValue = orgString.includes(':') ? orgString.split(':')[1] : orgString;
                      }
                      
                      return (
                        <span key={index} style={{
                          background: '#E9ECEF',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {displayValue}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kişiler */}
              {selectedGroup.persons && selectedGroup.persons.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    color: '#232D42',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '10px',
                    borderBottom: '2px solid #3A57E8',
                    paddingBottom: '5px'
                  }}>
                    {t('titles.authorization')} ({selectedGroup.persons.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {selectedGroup.persons.map((person, index) => {
                      const displayValue = getPersonLabel(person);
                      return (
                        <span key={index} style={{
                          background: '#E9ECEF',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {displayValue}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gezegenler */}
              {selectedGroup.planets && selectedGroup.planets.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    color: '#232D42',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '10px',
                    borderBottom: '2px solid #3A57E8',
                    paddingBottom: '5px'
                  }}>
                    {t('labels.planets')} ({selectedGroup.planets.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {selectedGroup.planets.map((planet, index) => {
                      const planetObj = planets.find(p => p.value === planet);
                      const displayValue = planetObj ? planetObj.label : planet;
                      return (
                        <span key={index} style={{
                          background: '#E9ECEF',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {displayValue}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowDetailsPopup(false)}
                style={{
                  backgroundColor: '#0286F7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = '1';
                }}
              >
                {t('buttons.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Popup */}
      {showBulkDeletePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#DC2626', fontSize: '24px' }}></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: '12px'
              }}>
                {t('titles.bulkDelete')}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '24px'
              }}>
                {formatBulkDeleteConfirm(selectedItems.length)}
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowBulkDeletePopup(false)}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter'
                }}
              >
                {t('buttons.no')}
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter'
                }}
              >
                {isSubmitting ? t('statuses.deleting') : t('buttons.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#DC2626', fontSize: '24px' }}></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                margin: '0 0 8px 0'
              }}>
                {t('titles.deleteGroup')}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: '0'
              }}>
                {formatDeleteGroupConfirm(selectedGroup?.groupName || selectedGroup?.name || '')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeletePopup(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = '#E5E7EB';
                }}
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#DC2626';
                }}
              >
                {t('buttons.deleteGroup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#D1FAE5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <i className="fas fa-check" style={{ color: '#059669', fontSize: '24px' }}></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                margin: '0 0 8px 0'
              }}>
                {t('labels.success')}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: '0 0 24px 0'
              }}>
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#3B82F6';
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#DC2626', fontSize: '24px' }}></i>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                margin: '0 0 8px 0'
              }}>
                {t('labels.error')}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: '0 0 24px 0'
              }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorPopup(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#DC2626';
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Grouping;