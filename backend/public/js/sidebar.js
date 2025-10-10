// Sidebar'ı oluştur
async function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    
    // Mevcut sayfanın yolunu al
    const currentPath = window.location.pathname;
    
    // Sayfa yolu ile menü öğesi eşleştirmesi
    const pageToMenuItem = {
        '/admin-panel.html': 'Genel Takip Sistemi',
        '/results.html': 'Kişi Sonuçları Sayfası',
        '/game-send.html': 'Oyun Gönder',
        '/gamemanagement.html': 'Oyun Tanımlama',
        '/authorization.html': 'Organizasyon Ayarları',
        '/authorization.html': 'Yetkilendirme',
        '/grouping.html': 'Organizasyon Ayarları', 
        '/organization.html': 'Organizasyon Ayarları',
        '/subscriptionSettings.html': 'Oyun Kullanım Özeti',
        '/competencySettings.html': 'Yetkinlik Ayarları',
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
        console.log('Süper admin kontrolü:', data);
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
                    <div class="menu-item ${activeMenuItem === 'Genel Takip Sistemi' ? 'active' : ''}">
                        <i class="fas fa-home"></i>
                        <span>Genel Takip Sistemi</span>
                    </div>
                     <div class="menu-item ${activeMenuItem === 'Şirket Çalışanları Sayfası' ? 'active' : ''}">
                        <i class="fas fa-building"></i>
                        <span>Şirket Çalışanları Sayfası</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                       <div class="menu-item ${activeMenuItem === 'Kişi Sonuçları Sayfası' ? 'active' : ''}">
                        <i class="fas fa-chart-bar"></i>
                        <span>Kişi Sonuçları Sayfası</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>            
                    <div class="menu-item ${activeMenuItem === 'Oyun Gönder' ? 'active' : ''}">
                        <i class="fas fa-comments"></i>
                        <span>Oyun Gönder</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                     <div class="menu-item ${activeMenuItem === 'Oyun Kullanım Özeti' ? 'active' : ''}">
                        <i class="fas fa-comments"></i>
                        <span>Oyun Kullanım Özeti</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
            </div>
            <div class="menu-section">
                <div class="menu-title">Ayarlar</div>
                <div class="menu-items">
                    <div class="menu-item expandable" data-expanded="${activeMenuItem === 'Firma Tanımlama' || activeMenuItem === 'Oyun Tanımlama' ? 'true' : 'false'}${isFirmaAdminiActive ? ' true' : ''}${isFirmaTanimlamaActive ? ' true' : ''}" ${isFirmaTanimlamaActive ? 'class="active"' : ''}>
                        <i class="fas fa-user-shield"></i>
                        <span>Firma Ayarları</span>
                        <i class="fas fa-plus expand-icon"></i>
                    </div>

                    <div class="submenu" style="display: ${activeMenuItem === 'Firma Tanımlama' || activeMenuItem === 'Oyun Tanımlama' || isFirmaAdminiActive || isFirmaTanimlamaActive ? 'block' : 'none'};">
                        ${isSuperAdmin ? `
                        <div class="submenu-item ${isFirmaTanimlamaActive ? 'active' : ''}">
                            <i class="fas fa-building"></i>
                            <span>Firma Tanımlama</span>
                        </div>
                        ` : ''}
                                                 ${isSuperAdmin ? `
                         <div class="submenu-item ${isFirmaAdminiActive ? 'active' : ''}">
                             <i class="fas fa-user-cog"></i>
                             <span>Firma Admini Tanımlama</span>
                         </div>
                         ` : ''}
                        ${isSuperAdmin ? `
                        <div class="submenu-item ${activeMenuItem === 'Oyun Tanımlama' ? 'active' : ''}">
                            <i class="fas fa-gamepad"></i>
                            <span>Oyun Tanımlama</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="menu-item ${activeMenuItem === 'Yetkinlik Ayarları' ? 'active' : ''}">
                        <i class="fas fa-user-shield"></i>
                        <span>Yetkinlik Ayarları</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item ${activeMenuItem === 'Yetkilendirme' ? 'active' : ''}">
                        <i class="fas fa-user-shield"></i>
                        <span>Yetkilendirme</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item ${activeMenuItem === 'Organizasyon Ayarları' ? 'active' : ''}">
                        <i class="fas fa-user-plus"></i>
                        <span>Organizasyon Ayarları</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item ${activeMenuItem === 'Sistem Ayarları' ? 'active' : ''}">
                        <i class="fas fa-cog"></i>
                        <span>Sistem Ayarları</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item ${activeMenuItem === 'Bildirimler' ? 'active' : ''}">
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

    // Sidebar stillerini ekle
    const style = document.createElement('style');
    style.textContent = `
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
        }

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
        }
    `;

    // Font Awesome'ı ekle
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';

    // Sidebar'ı ve stilleri sayfaya ekle
    document.head.appendChild(fontAwesome);
    document.head.appendChild(style);
    document.body.insertBefore(sidebar, document.body.firstChild);

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
                return; // Yönlendirme yapma
            }
            
            // Önce tüm active sınıflarını kaldır
            menuItems.forEach(i => i.classList.remove('active'));
            sidebar.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
            
            // Tıklanan öğeye active sınıfını ekle
            item.classList.add('active');
            
            // Menü öğesine göre yönlendirme yap
            switch(menuText) {
                case 'Genel Takip Sistemi':
                    window.location.href = '/admin-panel.html';
                    break;
                case 'Şirket Çalışanları Sayfası':
                    //window.location.href = '/employees.html';
                    break;
                case 'Kişi Sonuçları Sayfası':
                    window.location.href = '/results.html';
                    break;
                case 'Oyun Gönder':
                    window.location.href = '/game-send.html';
                    break;
                case 'Oyun Kullanım Özeti':
                    window.location.href = '/subscriptionSettings.html';
                    break;
                case 'Yetkilendirme':
                //  window.location.href = '/authorization.html';
                    break;
                case 'Yetkinlik Ayarları':
                    window.location.href = '/competencySettings.html';
                    break;
                case 'Organizasyon Ayarları':
                    window.location.href = '/organization.html';
                    break;
                case 'Sistem Ayarları':
                    window.location.href = '/admin-management.html';
                    break;
                case 'Bildirimler':
                    //window.location.href = '/notifications.html';
                    break;
            }
        });
    });

    // Submenu öğelerine tıklama olayı ekle
    const submenuItems = sidebar.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Önce tüm active sınıflarını kaldır
            menuItems.forEach(i => i.classList.remove('active'));
            submenuItems.forEach(i => i.classList.remove('active'));
            
            // Tıklanan öğeye active sınıfını ekle
            item.classList.add('active');
            
            // Menü öğesinin metnini al
            const menuText = item.querySelector('span').textContent;
            
            // Menü öğesine göre yönlendirme yap
            switch(menuText) {
                case 'Firma Tanımlama':
                    window.location.href = '/companyIdentification.html';
                    break;
                case 'Firma Admini Tanımlama':
                    window.location.href = '/defineCompanyAdmin.html';
                    break;
                case 'Oyun Tanımlama':
                    if (isSuperAdmin) {
                        window.location.href = '/gamemanagement.html';
                    }
                    break;
            }
        });
    });
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
    // Login sayfasında sidebar'ı gösterme
    if (!window.location.pathname.includes('admin.html')) {
        createSidebar();
        checkToken(); // Sayfa yüklendiğinde token kontrolü yap
    }
}); 