// Sidebar'ı oluştur
function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <img src="/images/logo.png" alt="Logo" class="logo">
        </div>
        <div class="sidebar-menu">
            <div class="menu-section">
                <div class="menu-title">Lorem</div>
                <div class="menu-items">
                    <div class="menu-item active">
                        <i class="fas fa-home"></i>
                        <span>Ana Sayfa</span>
                    </div>
                    <div class="menu-item">
                        <i class="fas fa-user"></i>
                        <span>Profil</span>
                    </div>
                    <div class="menu-item">
                        <i class="fas fa-cog"></i>
                        <span>Ayarlar</span>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-title">Pages</div>
                <div class="menu-items">
                    <div class="menu-item">
                        <i class="fas fa-file-alt"></i>
                        <span>Değerlendirmeler</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item">
                        <i class="fas fa-users"></i>
                        <span>Kullanıcılar</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="menu-item">
                        <i class="fas fa-chart-bar"></i>
                        <span>Raporlar</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-title">Lorem Ipsum</div>
                <div class="menu-items">
                    <div class="menu-item">
                        <i class="fas fa-info-circle"></i>
                        <span>Hakkında</span>
                    </div>
                    <div class="menu-item">
                        <i class="fas fa-question-circle"></i>
                        <span>Yardım</span>
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
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// Çıkış işlemi
function logout() {
    window.location.href = '/admin.html';
}

// Sayfa yüklendiğinde sidebar'ı oluştur
document.addEventListener('DOMContentLoaded', () => {
    // Login sayfasında sidebar'ı gösterme
    if (!window.location.pathname.includes('admin.html')) {
        createSidebar();
    }
}); 