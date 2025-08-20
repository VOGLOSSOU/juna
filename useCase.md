%% Relations - corrected Mermaid syntax

User o-- Souscription : souscrit
User o-- Avis : redige
User o-- PropositionAbonnement : propose
User o-- TicketSupport : cree
User -- Localisation : habite

Abonnement o-- Souscription : fait_objet
Abonnement o-- Avis : recoit
Abonnement -- Fournisseur : fourni_par
Abonnement -- Localisation : localise

Souscription -- Paiement : genere
Souscription o-- Ticket : genere
Souscription o-- Livraison : necessite

PropositionAbonnement -- User : proposee_par
PropositionAbonnement -- Localisation : localise

Fournisseur o-- Abonnement : propose
Fournisseur -- Localisation : situe

Administrateur o-- PropositionAbonnement : valide
Administrateur o-- TicketSupport : traite