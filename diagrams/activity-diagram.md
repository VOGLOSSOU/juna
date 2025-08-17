flowchart TD
    Start([Début]) --> CheckAuth{Utilisateur connecté?}
    
    CheckAuth -->|Non| Login[Se connecter]
    Login --> FillForm[Remplir formulaire de proposition]
    CheckAuth -->|Oui| FillForm
    
    FillForm --> ValidateForm{Formulaire valide?}
    ValidateForm -->|Non| ShowErrors[Afficher erreurs de validation]
    ShowErrors --> FillForm
    
    ValidateForm -->|Oui| ChooseVisibility{Choisir visibilité}
    ChooseVisibility --> SetPublic[Abonnement public]
    ChooseVisibility --> SetPrivate[Abonnement privé]
    
    SetPublic --> SubmitProposal[Soumettre proposition]
    SetPrivate --> SubmitProposal
    
    SubmitProposal --> SaveToDB[(Sauvegarder en base)]
    SaveToDB --> NotifyUser[Notifier utilisateur de la soumission]
    NotifyUser --> NotifyAdmin[Notifier équipe Juna]
    
    NotifyAdmin --> AdminReview{Révision par admin}
    
    AdminReview -->|Validée| ApproveProposal[Valider proposition]
    AdminReview -->|Rejetée| RejectProposal[Rejeter proposition]
    AdminReview -->|En attente| PendingReview[En attente de révision]
    
    ApproveProposal --> CreateSubscription[Créer abonnement public]
    CreateSubscription --> NotifyApproval[Notifier validation à l'utilisateur]
    NotifyApproval --> MakeAvailable[Rendre disponible sur plateforme]
    
    RejectProposal --> NotifyRejection[Notifier rejet avec commentaires]
    NotifyRejection --> OfferModification{Proposer modifications?}
    
    OfferModification -->|Oui| ModifyProposal[Modifier proposition]
    ModifyProposal --> SubmitProposal
    OfferModification -->|Non| EndRejected([Fin - Rejetée])
    
    MakeAvailable --> EndApproved([Fin - Validée])
    PendingReview --> EndPending([Fin - En attente])
    
    %% Styles
    classDef startEnd fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef decision fill:#fff3e0
    classDef database fill:#e8f5e8
    
    class Start,EndApproved,EndRejected,EndPending startEnd
    class FillForm,SubmitProposal,ApproveProposal,RejectProposal,CreateSubscription,NotifyUser,NotifyAdmin,NotifyApproval,NotifyRejection,MakeAvailable,ModifyProposal,Login,ShowErrors,SetPublic,SetPrivate process
    class CheckAuth,ValidateForm,ChooseVisibility,AdminReview,OfferModification decision
    class SaveToDB database