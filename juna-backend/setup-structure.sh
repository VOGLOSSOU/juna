#!/bin/bash

# Créer les dossiers principaux
mkdir -p prisma/migrations
mkdir -p src/{config,controllers,services,repositories,middlewares,routes,validators,types,utils,queues,constants}
mkdir -p tests/{unit/{services,utils},integration/api}
mkdir -p logs

# Créer les fichiers vides dans src/config
touch src/config/{database,redis,env,constants}.ts

# Créer les fichiers vides dans src/controllers
touch src/controllers/{auth,user,subscription,order,payment,proposal,review,ticket,notification,provider,admin,referral}.controller.ts

# Créer les fichiers vides dans src/services
touch src/services/{auth,user,subscription,order,payment,proposal,review,ticket,notification,provider,admin,email,referral}.service.ts

# Créer les fichiers vides dans src/repositories
touch src/repositories/{user,subscription,order,payment,proposal,review,ticket,notification,provider,referral}.repository.ts

# Créer les fichiers vides dans src/middlewares
touch src/middlewares/{auth,validation,error,rateLimiter,logger,upload}.middleware.ts

# Créer les fichiers vides dans src/routes
touch src/routes/{index,auth,user,subscription,order,payment,proposal,review,ticket,notification,provider,admin,referral}.routes.ts

# Créer les fichiers vides dans src/validators
touch src/validators/{auth,user,subscription,order,proposal,review,ticket,common}.validator.ts

# Créer les fichiers vides dans src/types
touch src/types/{express.d,auth.types,user.types,subscription.types,order.types,common.types}.ts

# Créer les fichiers vides dans src/utils
touch src/utils/{jwt,hash,response,logger,errors,qrcode,validation}.util.ts

# Créer les fichiers vides dans src/queues
touch src/queues/{email,notification,subscription}.queue.ts

# Créer les fichiers vides dans src/constants
touch src/constants/{errors,roles,status,messages}.ts

# Créer les fichiers principaux
touch src/{app,server}.ts

# Créer les fichiers de test
touch tests/unit/services/{auth,user}.service.test.ts
touch tests/unit/utils/{jwt,hash}.util.test.ts
touch tests/integration/api/{auth,user,subscription}.test.ts

# Créer prisma/seed.ts
touch prisma/seed.ts

# Créer les fichiers de configuration
touch .env.example .gitignore .eslintrc.js .prettierrc tsconfig.json jest.config.js docker-compose.yml Dockerfile

echo "✅ Structure créée avec succès !"