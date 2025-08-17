graph TB
    %% Interface utilisateur
    subgraph "Couche Présentation"
        WebApp[📱 Application Web<br/>React/Angular]
        MobileApp[📱 Application Mobile<br/>React Native/Flutter]
        AdminPanel[💻 Panel Admin<br/>Dashboard]
    end
    
    %% API Gateway
    subgraph "Couche API"
        Gateway[🚪 API Gateway<br/>Routage, Auth, Rate Limiting]
    end
    
    %% Services métier
    subgraph "Couche Services"
        AuthService[🔐 Service Auth<br/>JWT, OAuth]
        UserService[👤 Service Utilisateur<br/>Profils, Préférences]
        SubService[📋 Service Abonnement<br/>CRUD, Recherche, Filtrage]
        PaymentService[💳 Service Paiement<br/>Transactions, Factures]
        NotifService[📢 Service Notification<br/>Email, Push, SMS]
        ReviewService[⭐ Service Avis<br/>Notes, Commentaires]
        TicketService[🎫 Service Ticket<br/>QR Code, Validation]
        GeoService[🗺️ Service Géolocalisation<br/>Maps, Distance]
        SupportService[🎧 Service Support<br/>Tickets, Chat]
    end
    
    %% Services externes
    subgraph "Services Externes"
        PaymentGW[💰 Passerelles Paiement<br/>Mobile Money, Banks]
        EmailProvider[📧 Service Email<br/>SendGrid, AWS SES]
        PushProvider[📲 Service Push<br/>Firebase, OneSignal]
        MapsAPI[🗺️ API Cartographie<br/>Google Maps, OpenStreet]
        StorageService[☁️ Stockage Cloud<br/>AWS S3, Cloudinary]
    end
    
    %% Base de données
    subgraph "Couche Données"
        MainDB[(🗄️ Base Principale<br/>PostgreSQL/MongoDB)]
        CacheDB[(⚡ Cache<br/>Redis)]
        FileStorage[(📁 Stockage Fichiers<br/>Images, Documents)]
    end
    
    %% Connexions Interface -> API
    WebApp --> Gateway
    MobileApp --> Gateway
    AdminPanel --> Gateway
    
    %% Connexions API -> Services
    Gateway --> AuthService
    Gateway --> UserService
    Gateway --> SubService
    Gateway --> PaymentService
    Gateway --> NotifService
    Gateway --> ReviewService
    Gateway --> TicketService
    Gateway --> GeoService
    Gateway --> SupportService
    
    %% Connexions entre services
    UserService --> AuthService
    SubService --> GeoService
    PaymentService --> NotifService
    TicketService --> SubService
    ReviewService --> SubService
    SupportService --> UserService
    
    %% Connexions vers services externes
    PaymentService --> PaymentGW
    NotifService --> EmailProvider
    NotifService --> PushProvider
    GeoService --> MapsAPI
    UserService --> StorageService
    SubService --> StorageService
    
    %% Connexions vers données
    AuthService --> MainDB
    UserService --> MainDB
    SubService --> MainDB
    PaymentService --> MainDB
    ReviewService --> MainDB
    TicketService --> MainDB
    SupportService --> MainDB
    
    %% Cache
    UserService --> CacheDB
    SubService --> CacheDB
    GeoService --> CacheDB
    
    %% Stockage fichiers
    UserService --> FileStorage
    SubService --> FileStorage
    ReviewService --> FileStorage