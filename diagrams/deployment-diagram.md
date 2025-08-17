graph TB
    %% Clients
    subgraph "Clients"
        Browser[🌐 Navigateur Web<br/>Chrome, Firefox, Safari]
        AndroidApp[📱 Application Android<br/>APK/Play Store]
        iOSApp[📱 Application iOS<br/>App Store]
    end
    
    %% CDN et Load Balancer
    subgraph "Edge Infrastructure"
        CDN[☁️ CDN<br/>CloudFlare/AWS CloudFront<br/>Mise en cache statique]
        LB[⚖️ Load Balancer<br/>NGINX/AWS ALB<br/>Répartition de charge]
    end
    
    %% Serveurs Web
    subgraph "Web Tier"
        WebServer1[🖥️ Serveur Web 1<br/>Node.js/Express<br/>API REST]
        WebServer2[🖥️ Serveur Web 2<br/>Node.js/Express<br/>API REST]
        WebServer3[🖥️ Serveur Web 3<br/>Node.js/Express<br/>API REST]
    end
    
    %% Services applicatifs
    subgraph "Application Tier"
        AuthMicroservice[🔐 Auth Service<br/>Docker Container<br/>JWT Management]
        UserMicroservice[👤 User Service<br/>Docker Container<br/>Profile Management]
        SubMicroservice[📋 Subscription Service<br/>Docker Container<br/>Business Logic]
        PaymentMicroservice[💳 Payment Service<br/>Docker Container<br/>Transaction Processing]
        NotifMicroservice[📢 Notification Service<br/>Docker Container<br/>Message Queue]
    end
    
    %% Base de données
    subgraph "Data Tier"
        PrimaryDB[(🗄️ Base Principale<br/>PostgreSQL Master<br/>Données transactionnelles)]
        ReplicaDB[(📋 Base Réplica<br/>PostgreSQL Slave<br/>Lecture seule)]
        CacheDB[(⚡ Cache Redis<br/>Sessions, Cache applicatif)]
        SearchDB[(🔍 Elasticsearch<br/>Recherche et filtrage)]
    end
    
    %% Stockage
    subgraph "Storage"
        FileStorage[📁 Stockage Fichiers<br/>AWS S3/Google Cloud<br/>Images, Documents]
        BackupStorage[💾 Sauvegarde<br/>AWS Glacier<br/>Archives]
    end
    
    %% Services externes
    subgraph "Services Externes"
        PaymentGW[💰 Passerelles Paiement<br/>Mobile Money APIs<br/>Stripe, PayPal]
        EmailService[📧 Service Email<br/>SendGrid, AWS SES]
        PushService[📲 Service Push<br/>Firebase FCM, APNs]
        MapsAPI[🗺️ API Cartographie<br/>Google Maps API]
        SMSService[📱 Service SMS<br/>Twilio, AWS SNS]
    end
    
    %% Monitoring et logs
    subgraph "Monitoring"
        LogServer[📊 Serveur Logs<br/>ELK Stack<br/>Elasticsearch, Kibana]
        MonitoringServer[📈 Monitoring<br/>Prometheus, Grafana<br/>Métriques système]
    end
    
    %% Connexions clients
    Browser --> CDN
    AndroidApp --> CDN
    iOSApp --> CDN
    
    %% Flux principal
    CDN --> LB
    LB --> WebServer1
    LB --> WebServer2
    LB --> WebServer3
    
    %% Connexions vers microservices
    WebServer1 --> AuthMicroservice
    WebServer1 --> UserMicroservice
    WebServer1 --> SubMicroservice
    WebServer1 --> PaymentMicroservice
    WebServer1 --> NotifMicroservice
    
    WebServer2 --> AuthMicroservice
    WebServer2 --> UserMicroservice
    WebServer2 --> SubMicroservice
    WebServer2 --> PaymentMicroservice
    WebServer2 --> NotifMicroservice
    
    WebServer3 --> AuthMicroservice
    WebServer3 --> UserMicroservice
    WebServer3 --> SubMicroservice
    WebServer3 --> PaymentMicroservice
    WebServer3 --> NotifMicroservice
    
    %% Connexions base de données
    AuthMicroservice --> PrimaryDB
    UserMicroservice --> PrimaryDB
    SubMicroservice --> PrimaryDB
    PaymentMicroservice --> PrimaryDB
    
    %% Lecture sur réplica
    UserMicroservice --> ReplicaDB
    SubMicroservice --> ReplicaDB
    
    %% Cache
    AuthMicroservice --> CacheDB
    UserMicroservice --> CacheDB
    SubMicroservice --> CacheDB
    
    %% Recherche
    SubMicroservice --> SearchDB
    
    %% Stockage
    UserMicroservice --> FileStorage
    SubMicroservice --> FileStorage
    
    %% Services externes
    PaymentMicroservice --> PaymentGW
    NotifMicroservice --> EmailService
    NotifMicroservice --> PushService
    NotifMicroservice --> SMSService
    SubMicroservice --> MapsAPI
    
    %% Sauvegarde
    PrimaryDB --> BackupStorage
    FileStorage --> BackupStorage
    
    %% Monitoring
    WebServer1 --> LogServer
    WebServer2 --> LogServer
    WebServer3 --> LogServer
    AuthMicroservice --> LogServer
    UserMicroservice --> LogServer
    SubMicroservice --> LogServer
    PaymentMicroservice --> LogServer
    NotifMicroservice --> LogServer
    
    WebServer1 --> MonitoringServer
    WebServer2 --> MonitoringServer
    WebServer3 --> MonitoringServer
    PrimaryDB --> MonitoringServer
    CacheDB --> MonitoringServer