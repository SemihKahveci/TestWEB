// Sidebar'ı oluştur
async function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    
    // Mevcut sayfanın yolunu al
    const currentPath = window.location.pathname;
    
    // Sayfa yolu ile menü öğesi eşleştirmesi
    const pageToMenuItem = {
        '/admin-panel.html': 'Genel Takip Sistemi',
        '/results.html': 'Aday Sonuçları Sayfası',
        '/game-send.html': 'Oyun Gönder',
        '/admin-management.html': 'Firma Tanımlama',
        '/addGroup.html': 'Organizasyon Tanımlama',
        '/authorization.html': 'Yetkilendirme',
        '/grouping.html': 'Yetkilendirme', 
        '/organization.html': 'Yetkilendirme',
    };
    
    // Aktif menü öğesini belirle
    const activeMenuItem = pageToMenuItem[currentPath] || 'Genel Takip Sistemi';

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
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-title">Sayfalar</div>
                <div class="menu-items">.
                     <div class="menu-item ${activeMenuItem === 'Şirket Çalışanları Sayfası' ? 'active' : ''}">
                        <i class="fas fa-building"></i>
                        <span>Şirket Çalışanları Sayfası</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                       <div class="menu-item ${activeMenuItem === 'Aday Sonuçları Sayfası' ? 'active' : ''}">
                        <i class="fas fa-chart-bar"></i>
                        <span>Aday Sonuçları Sayfası</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>            
                    <div class="menu-item ${activeMenuItem === 'Oyun Gönder' ? 'active' : ''}">
                        <i class="fas fa-comments"></i>
                        <span>Oyun Gönder</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                 
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-title">Ayarlar</div>
                <div class="menu-items">
                    <div class="menu-item ${activeMenuItem === 'Pozisyon' ? 'active' : ''}">
                        <i class="fas fa-briefcase"></i>
                        <span>Pozisyon</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>  
                   <div class="menu-item ${activeMenuItem === 'Yetkilendirme' ? 'active' : ''}">
                        <i class="fas fa-user-shield"></i>
                        <span>Yetkilendirme</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                       <div class="menu-item ${activeMenuItem === 'Organizasyon Yapısı' ? 'active' : ''}">
                        <i class="fas fa-user-shield"></i>
                        <span>Organizasyon Yapısı</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    ${isSuperAdmin ? `
                    <div class="menu-item ${activeMenuItem === 'Firma Tanımlama' ? 'active' : ''}">
                        <i class="fas fa-building"></i>
                        <span>Firma Tanımlama</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    ` : ''}
                    <div class="menu-item ${activeMenuItem === 'Organizasyon Tanımlama' ? 'active' : ''}">
                        <i class="fas fa-user-plus"></i>
                        <span>Organizasyon Tanımlama</span>
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
            // Önce tüm active sınıflarını kaldır
            menuItems.forEach(i => i.classList.remove('active'));
            // Tıklanan öğeye active sınıfını ekle
            item.classList.add('active');
            
            // Menü öğesinin metnini al
            const menuText = item.querySelector('span').textContent;
            
            // Menü öğesine göre yönlendirme yap
            switch(menuText) {
                case 'Genel Takip Sistemi':
                    window.location.href = '/admin-panel.html';
                    break;
                case 'Pozisyon':
                    //window.location.href = '/positions.html';
                    break;
                case 'Şirket Çalışanları Sayfası':
                    //window.location.href = '/employees.html';
                    break;
                case 'Aday Sonuçları Sayfası':
                    window.location.href = '/results.html';
                    break;
                case 'Oyun Gönder':
                    window.location.href = '/game-send.html';
                    break;
                case 'Yetkilendirme':
                    window.location.href = '/authorization.html';
                    break;
                case 'Organizasyon Yapısı':
                    //window.location.href = '/organization-structure.html';
                    break;
                case 'Firma Tanımlama':
                    window.location.href = '/admin-management.html';
                    break;
                case 'Organizasyon Tanımlama':
                    window.location.href = '/addGroup.html';
                    break;
                case 'Sistem Ayarları':
                    //window.location.href = '/system-settings.html';
                    break;
                case 'Bildirimler':
                    //window.location.href = '/notifications.html';
                    break;
            }
        });
    });
}

// Çıkış işlemi
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/admin.html';
}


// Token kontrolü ve otomatik yönlendirme
function checkToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // saniyeyi milisaniyeye çevir
        
        if (Date.now() >= expiry) {
            localStorage.removeItem('token');
            window.location.href = '/admin.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
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