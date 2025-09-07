// Sidebar durumunu localStorage'da sakla
const SIDEBAR_STATE_KEY = 'sidebar_state';

// Sidebar durumunu kaydet
function saveSidebarState(state) {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
}

// Sidebar durumunu yükle
function loadSidebarState() {
    const state = localStorage.getItem(SIDEBAR_STATE_KEY);
    return state ? JSON.parse(state) : null;
}

// Global sidebar referansı
let globalSidebar = null;

// Sidebar'ı oluştur
async function createSidebar() {
    // Eğer sidebar zaten varsa, sadece aktif menüyü güncelle
    if (document.querySelector('.sidebar')) {
        console.log('Sidebar zaten mevcut, sadece aktif menü güncelleniyor');
        updateActiveMenuItem();
        return;
    }

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    globalSidebar = sidebar;
    
    // Mevcut sayfanın yolunu al
    const currentPath = window.location.pathname;
    
    // Sayfa yolu ile menü öğesi eşleştirmesi
    const pageToMenuItem = {
        '/admin-panel.html': 'Genel Takip Sistemi',
        '/results.html': 'Aday Sonuçları Sayfası',
        '/game-send.html': 'Oyun Gönder',
        '/gamemanagement.html': 'Oyun Tanımlama',
        '/addGroup.html': 'Organizasyon Tanımlama',
        '/authorization.html': 'Yetkilendirme',
        '/grouping.html': 'Yetkilendirme', 
        '/organization.html': 'Yetkilendirme',
        '/subscriptionSettings.html': 'Oyun Kullanım Özeti',
        '/companyIdentification.html': 'Firma Tanımlama',
        '/defineCompanyAdmin.html': 'Firma Admini Tanımlama',
    };
    
    // Aktif menü öğesini belirle
    const activeMenuItem = pageToMenuItem[currentPath] || 'Genel Takip Sistemi';
    // Aktif submenu kontrolü için
    const isFirmaAdminiActive = currentPath === '/defineCompanyAdmin.html';
    const isFirmaTanimlamaActive = currentPath === '/companyIdentification.html';

    // Kullanıcı rolünü kontrol et
    let isSuperAdmin = false;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/check-superadmin', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        isSuperAdmin = data.isSuperAdmin;
    } catch (error) {
        console.error('Rol kontrolü hatası:', error);
    }
    
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <img src="/images/logo.png" alt="Logo" class="logo">
        </div>
        <div class="sidebar-menu">
            <div class="menu-section">
                <div class="menu-title">Ana Menü</div>
                <div class="menu-items">
                    <div class="menu-item" data-menu="Genel Takip Sistemi">
                        <i class="fas fa-home"></i>
                        <span>Genel Takip Sistemi</span>
                    </div>
                     <div class="menu-item" data-menu="Şirket Çalışanları Sayfası">
                        <i class="fas fa-building"></i>
                        <span>Şirket Çalışanları Sayfası</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                        <div class="menu-item" data-menu="Aday Sonuçları Sayfası">
                        <i class="fas fa-chart-bar"></i>
                        <span>Aday Sonuçları Sayfası</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>            
                    <div class="menu-item" data-menu="Oyun Gönder">
                        <i class="fas fa-comments"></i>
                        <span>Oyun Gönder</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                     <div class="menu-item" data-menu="Oyun Kullanım Özeti">
                        <i class="fas fa-comments"></i>
                        <span>Oyun Kullanım Özeti</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
            </div>
            <div class="menu-section">
                <div class="menu-title">Ayarlar</div>
                <div class="menu-items">
                    <div class="menu-item expandable" data-menu="Firma Ayarları" data-expanded="${activeMenuItem === 'Firma Tanımlama' || activeMenuItem === 'Oyun Tanımlama' || isFirmaAdminiActive || isFirmaTanimlamaActive ? 'true' : 'false'}">
                        <i class="fas fa-user-shield"></i>
                        <span>Firma Ayarları</span>
                        <i class="fas fa-plus expand-icon"></i>
                    </div>
                    <div class="submenu" style="display: ${activeMenuItem === 'Firma Tanımlama' || activeMenuItem === 'Oyun Tanımlama' || isFirmaAdminiActive || isFirmaTanimlamaActive ? 'block' : 'none'};">
                        ${isSuperAdmin ? `
                        <div class="submenu-item" data-menu="Firma Tanımlama">
                            <i class="fas fa-building"></i>
                            <span>Firma Tanımlama</span>
                        </div>
                        ` : ''}
                                                 ${isSuperAdmin ? `
                         <div class="submenu-item" data-menu="Firma Admini Tanımlama">
                             <i class="fas fa-user-cog"></i>
                             <span>Firma Admini Tanımlama</span>
                         </div>
                         ` : ''}
                        ${isSuperAdmin ? `
                        <div class="submenu-item" data-menu="Oyun Tanımlama">
                            <i class="fas fa-gamepad"></i>
                            <span>Oyun Tanımlama</span>
                        </div>
                        ` : ''}
                    </div>
                   <div class="menu-item" data-menu="Yetkilendirme">
                        <i class="fas fa-user-shield"></i>
                        <span>Yetkilendirme</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                        <div class="menu-item" data-menu="Organizasyon Yapısı">
                        <i class="fas fa-user-shield"></i>
                        <span>Organizasyon Yapısı</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>

                    <div class="menu-item" data-menu="Organizasyon Tanımlama">
                        <i class="fas fa-user-plus"></i>
                        <span>Organizasyon Tanımlama</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item" data-menu="Sistem Ayarları">
                        <i class="fas fa-cog"></i>
                        <span>Sistem Ayarları</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item" data-menu="Bildirimler">
                        <i class="fas fa-bell"></i>
                        <span>Bildirimler</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="sidebar-footer">
            <button class="logout-button" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i>
                <span>Çıkış Yap</span>
            </button>
        </div>
    `;

    // Sidebar stillerini ekle (eğer daha önce eklenmemişse)
    if (!document.querySelector('#sidebar-styles')) {
        const style = document.createElement('style');
        style.id = 'sidebar-styles';
        style.textContent = `
            /* Sidebar stilleri yukarıda tanımlandı */

            .sidebar-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
            }

            .logo {
                width: 150px;
                height: auto;
            }

            .sidebar-menu {
                flex: 1;
                padding: 20px 0;
                overflow-y: auto;
            }

            .menu-section {
                margin-bottom: 30px;
            }

            .menu-title {
                padding: 0 20px;
                color: #8A92A6;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 10px;
            }

            .menu-items {
                display: flex;
                flex-direction: column;
            }

            .menu-item {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                color: #232D42;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .menu-item:hover {
                background-color: #f5f5f5;
            }

            .menu-item.active {
                background-color: #3A57E8;
                color: white;
            }

            .menu-item i {
                margin-right: 10px;
                width: 20px;
                text-align: center;
            }

            .menu-item span {
                flex: 1;
            }

            .menu-item .fa-chevron-right {
                font-size: 12px;
                margin-left: 10px;
            }

            .menu-item.expandable {
                position: relative;
            }

            .expand-icon {
                font-size: 12px;
                margin-left: 10px;
                transition: transform 0.3s ease;
            }


            .menu-item.expandable.expanded .expand-icon {
                transform: rotate(45deg);
            }

            .menu-item.expandable .expand-icon {
                font-size: 12px;
                margin-left: 10px;
                transition: transform 0.3s ease;
                color: #232D42;
                background: none !important;
                border: none !important;
                padding: 0 !important;
            }

            .menu-item.active .expand-icon {
                color: white;
                background-color: transparent !important;
            }

            .submenu {
                background-color: #f8f9fa;
                border-left: 3px solid #3A57E8;
                transition: all 0.3s ease;
            }

            .submenu-item {
                display: flex;
                align-items: center;
                padding: 10px 20px 10px 50px;
                color: #232D42;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .submenu-item:hover {
                background-color: #e9ecef;
            }

            .submenu-item.active {
                background-color: #3A57E8;
                color: white;
            }

            .submenu-item i {
                margin-right: 10px;
                width: 20px;
                text-align: center;
            }

            .sidebar-footer {
                padding: 20px;
                border-top: 1px solid #eee;
            }

            .logout-button {
                width: 100%;
                padding: 12px;
                background-color: #f8f9fa;
                border: none;
                border-radius: 5px;
                color: #dc3545;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s ease;
            }

            .logout-button:hover {
                background-color: #dc3545;
                color: white;
            }

            /* Ana içerik alanını sidebar'a göre ayarla */
            body {
                margin-left: 257px;
                transition: none;
            }

            /* Sayfa geçiş animasyonu */
            .page-transition {
                opacity: 0;
                transition: opacity 0.1s ease;
            }

            .page-transition.loaded {
                opacity: 1;
            }

            /* Sidebar için daha smooth transition */
            .sidebar {
                position: fixed;
                left: 0;
                top: 0;
                width: 257px;
                height: 100vh;
                background-color: #fff;
                box-shadow: 2px 0 5px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                z-index: 1000;
                transition: none;
                transform: translateZ(0);
                will-change: transform;
            }

            /* Loading animasyonu */
            .page-loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.1s ease;
                backdrop-filter: blur(1px);
            }

            .page-loading.show {
                opacity: 1;
                visibility: visible;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3A57E8;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

        `;

        // Font Awesome'ı ekle (eğer daha önce eklenmemişse)
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }

        document.head.appendChild(style);
    }

    // Sidebar'ı sayfaya ekle
    document.body.insertBefore(sidebar, document.body.firstChild);

    // Event listener'ları ekle
    setupSidebarEventListeners(sidebar);

    // Aktif menüyü güncelle
    updateActiveMenuItem();

    // Kaydedilmiş sidebar durumunu yükle
    loadSavedSidebarState();
}

// Aktif menü öğesini güncelle
function updateActiveMenuItem() {
    const currentPath = window.location.pathname;
    const pageToMenuItem = {
        '/admin-panel.html': 'Genel Takip Sistemi',
        '/results.html': 'Aday Sonuçları Sayfası',
        '/game-send.html': 'Oyun Gönder',
        '/gamemanagement.html': 'Oyun Tanımlama',
        '/addGroup.html': 'Organizasyon Tanımlama',
        '/authorization.html': 'Yetkilendirme',
        '/grouping.html': 'Yetkilendirme', 
        '/organization.html': 'Yetkilendirme',
        '/subscriptionSettings.html': 'Oyun Kullanım Özeti',
        '/companyIdentification.html': 'Firma Tanımlama',
        '/defineCompanyAdmin.html': 'Firma Admini Tanımlama',
    };
    
    const activeMenuItem = pageToMenuItem[currentPath] || 'Genel Takip Sistemi';
    const isFirmaAdminiActive = currentPath === '/defineCompanyAdmin.html';
    const isFirmaTanimlamaActive = currentPath === '/companyIdentification.html';

    // Tüm active sınıflarını kaldır
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    sidebar.querySelectorAll('.submenu-item').forEach(item => item.classList.remove('active'));

    // Aktif menü öğesini bul ve active yap
    const activeMenuElement = sidebar.querySelector(`[data-menu="${activeMenuItem}"]`);
    if (activeMenuElement) {
        activeMenuElement.classList.add('active');
    }

    // Submenu öğeleri için özel kontrol
    if (isFirmaTanimlamaActive) {
        const firmaTanimlamaElement = sidebar.querySelector('[data-menu="Firma Tanımlama"]');
        if (firmaTanimlamaElement) {
            firmaTanimlamaElement.classList.add('active');
        }
    }

    if (isFirmaAdminiActive) {
        const firmaAdminiElement = sidebar.querySelector('[data-menu="Firma Admini Tanımlama"]');
        if (firmaAdminiElement) {
            firmaAdminiElement.classList.add('active');
        }
    }

    // Firma Ayarları submenu'sünü genişlet
    const firmaAyarlariElement = sidebar.querySelector('[data-menu="Firma Ayarları"]');
    if (firmaAyarlariElement && (activeMenuItem === 'Firma Tanımlama' || activeMenuItem === 'Oyun Tanımlama' || isFirmaAdminiActive || isFirmaTanimlamaActive)) {
        firmaAyarlariElement.setAttribute('data-expanded', 'true');
        firmaAyarlariElement.classList.add('expanded');
        const submenu = firmaAyarlariElement.nextElementSibling;
        if (submenu) {
            submenu.style.display = 'block';
        }
    }
}

// Sidebar event listener'larını kur
function setupSidebarEventListeners(sidebar) {
    // Menü öğelerine tıklama olayı ekle
    const menuItems = sidebar.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const menuText = item.querySelector('span').textContent;
            
            // Eğer expandable menü öğesiyse
            if (item.classList.contains('expandable')) {
                const isExpanded = item.getAttribute('data-expanded') === 'true';
                const submenu = item.nextElementSibling;
                
                if (isExpanded) {
                    // Daralt
                    item.setAttribute('data-expanded', 'false');
                    item.classList.remove('expanded');
                    submenu.style.display = 'none';
                } else {
                    // Genişlet
                    item.setAttribute('data-expanded', 'true');
                    item.classList.add('expanded');
                    submenu.style.display = 'block';
                }
                
                // Durumu kaydet
                saveSidebarState({
                    expandedMenus: Array.from(sidebar.querySelectorAll('.menu-item.expandable[data-expanded="true"]'))
                        .map(item => item.querySelector('span').textContent)
                });
                
                return; // Yönlendirme yapma
            }
            
            // Sayfa geçişini yumuşak hale getir
            showPageLoading();
            
            // Menü öğesine göre yönlendirme yap
            setTimeout(() => {
                navigateToPage(menuText);
            }, 50);
        });
    });

    // Submenu öğelerine tıklama olayı ekle
    const submenuItems = sidebar.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Sayfa geçişini yumuşak hale getir
            showPageLoading();
            
            // Menü öğesinin metnini al
            const menuText = item.querySelector('span').textContent;
            
            // Menü öğesine göre yönlendirme yap
            setTimeout(() => {
                navigateToPage(menuText);
            }, 50);
        });
    });
}

// Sayfa yönlendirme fonksiyonu
function navigateToPage(menuText) {
    let targetUrl = '';
    
    switch(menuText) {
        case 'Genel Takip Sistemi':
            targetUrl = '/admin-panel.html';
            break;
        case 'Aday Sonuçları Sayfası':
            targetUrl = '/results.html';
            break;
        case 'Oyun Gönder':
            targetUrl = '/game-send.html';
            break;
        case 'Oyun Kullanım Özeti':
            targetUrl = '/subscriptionSettings.html';
            break;
        case 'Yetkilendirme':
            targetUrl = '/authorization.html';
            break;
        case 'Organizasyon Tanımlama':
            targetUrl = '/addGroup.html';
            break;
        case 'Sistem Ayarları':
            targetUrl = '/admin-management.html';
            break;
        case 'Firma Tanımlama':
            targetUrl = '/companyIdentification.html';
            break;
        case 'Firma Admini Tanımlama':
            targetUrl = '/defineCompanyAdmin.html';
            break;
        case 'Oyun Tanımlama':
            targetUrl = '/gamemanagement.html';
            break;
    }
    
    if (targetUrl && targetUrl !== window.location.pathname) {
        window.location.href = targetUrl;
    } else {
        hidePageLoading();
    }
}

// Loading göstergesi
function showPageLoading() {
    let loading = document.querySelector('.page-loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.className = 'page-loading';
        loading.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loading);
    }
    loading.classList.add('show');
}

function hidePageLoading() {
    const loading = document.querySelector('.page-loading');
    if (loading) {
        loading.classList.remove('show');
    }
}

// Kaydedilmiş sidebar durumunu yükle
function loadSavedSidebarState() {
    const savedState = loadSidebarState();
    if (savedState && savedState.expandedMenus) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        const menuItems = sidebar.querySelectorAll('.menu-item');
        savedState.expandedMenus.forEach(menuText => {
            const menuItem = Array.from(menuItems).find(item => 
                item.querySelector('span').textContent === menuText && 
                item.classList.contains('expandable')
            );
            if (menuItem) {
                menuItem.setAttribute('data-expanded', 'true');
                menuItem.classList.add('expanded');
                const submenu = menuItem.nextElementSibling;
                if (submenu) {
                    submenu.style.display = 'block';
                }
            }
        });
    }
}

// Çıkış işlemi
function logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/admin.html';
}

// Token kontrolü ve otomatik yönlendirme
function checkToken() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // saniyeyi milisaniyeye çevir
        
        if (Date.now() >= expiry) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/admin.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/admin.html';
        return;
    }
}

// Her 5 dakikada bir token kontrolü yap
setInterval(checkToken, 5 * 60 * 1000);

// Sayfa yüklendiğinde sidebar'ı oluştur
document.addEventListener('DOMContentLoaded', () => {
    // Login sayfasında sidebar'ı gösterme ve margin'i sıfırla
    if (window.location.pathname.includes('admin.html')) {
        document.body.style.marginLeft = '0';
    } else {
        // Sidebar'ı hemen oluştur
        createSidebar();
        checkToken(); // Sayfa yüklendiğinde token kontrolü yap
        
        // Sayfa geçiş animasyonunu daha hızlı tamamla
        setTimeout(() => {
            document.body.classList.remove('page-transition');
            document.body.classList.add('loaded');
            hidePageLoading();
        }, 50);
    }
});

// Sayfa geçişlerinde sidebar'ı koru
window.addEventListener('beforeunload', () => {
    // Sidebar durumunu kaydet
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const expandedMenus = Array.from(sidebar.querySelectorAll('.menu-item.expandable[data-expanded="true"]'))
            .map(item => item.querySelector('span').textContent);
        saveSidebarState({ expandedMenus });
    }
}); 