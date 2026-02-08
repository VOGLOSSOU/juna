nathan-voglossou@nathan-voglossou-Latitude-7280:~/juna$ cd juna-backend
nathan-voglossou@nathan-voglossou-Latitude-7280:~/juna/juna-backend$ curl http://localhost:5000/health
{"success":true,"message":"API is running","data":{"status":"healthy","timestamp":"2025-12-22T06:11:18.987Z","uptime":27.767262547,"environment":"development"}}

nathan-voglossou@nathanathan-voglossou@nathan-voglossou-Latitude-7280:~/juna/juna-backend$ curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nathan@juna.app",
    "password": "Password123",
    "name": "Nathan Voglossou",
    "phone": "+22997123456"Créer un document
Galerie de modèles
 
Documents récents

  }'
{"success":true,"message":"Compte créé avec succès","data":{"user":{"id":"804afb88-1477-41cc-b4b8-ff4a97fc71d4","email":"nathan@juna.app","name":"Nathan Voglossou","phone":"+22997123456","role":"USER","isVerified":false,"isActive":true,"createdAt":"2025-12-22T06:11:42.518Z","updatedAt":"2025-12-22T06:11:42.518Z"},"tokens":{"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MDRhZmI4OC0xNDc3LTQxY2MtYjRiOC1mZjRhOTdmYzcxZDQiLCJlbWFpbCI6Im5hdGhhbkBqdW5hLmFwcCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2MzgzOTAyLCJleHAiOjE3NjYzODQ4MDJ9.x03oBY8urhFbquJtuwpJFEtvgZblYQOVMMcdS8tw7Qk","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MDRhZmI4OC0xNDc3LTQxY2MtYjRiOC1mZjRhOTdmYzcxZDQiLCJlbWFpbCI6Im5hdGhhbkBqdW5hLmFwcCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2MzgzOTAyLCJleHAiOjE3NjY5ODg3MDJ9.pNB1e3P5Vz2LwLntb2Ig87PPOL-zSupCgbaCmVHgw84"}}}


nathan-voglossou@nathan-voglossou-Latitude-7280:~/juna/juna-backend$ curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nathan@juna.app",
    "password": "Password123"
  }'
{"success":true,"message":"Connexion réussie","data":{"user":{"id":"804afb88-1477-41cc-b4b8                                      -ff4a97fc71d4","email":"nathan@juna.app","name":"Nathan Voglossou","phone":"+22997123456","                                      role":"USER","isVerified":false,"isActive":true,"createdAt":"2025-12-22T06:11:42.518Z","upd                       atedAt":"2025-12-22T06:11:42.518Z"},"tokens":{"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6Ik                                      pXVCJ9.eyJ1c2VySWQiOiI4MDRhZmI4OC0xNDc3LTQxY2MtYjRiOC1mZjRhOTdmYzcxZDQiLCJlbWFpbCI6Im5hdGhh        bkBqdW5hLmFwcCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2MzgzOTM1LCJleHAiOjE3NjYzODQ4MzV9.BWPQOBCrRx                                      unyZtRYS383ySfhWgEQ82oH1fpp6eackw","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ                                      1c2VySWQiOiI4MDRhZmI4OC0xNDc3LTQxY2MtYjRiOC1mZjRhOTdmYzcxZDQiLCJlbWFpbCI6Im5hdGhhbkBqdW5hLm                               FwcCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2MzgzOTM1LCJleHAiOjE3NjY5ODg3MzV9.5zk7DFkdgAp19keKA6lv                                      X1LSNXz29T9ZDHxc8fauMx4"}}}nathan-voglossou@nathan-voglossou-Latitude-7280:~/juna/juna-back
nathan-voglossou@nathan-voglossou-Latitude-7280:~/juna/juna-backend$ 