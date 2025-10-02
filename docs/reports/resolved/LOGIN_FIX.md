# 🔐 Fix du Problème de Login

## ❌ **Problème Identifié**
Le frontend n'arrive pas à se connecter (erreurs 401) même si l'API fonctionne.

## ✅ **Solution**

### 🎯 **Credentials Corrects**
Utilise ces credentials dans le **frontend** (http://localhost:3001/auth/login):

**Option 1**: 
- **Email**: `paul@test.com`
- **Password**: `123456`

**Option 2**:
- **Email**: `admin@test.com` 
- **Password**: `admin123`

### 🔧 **Test API Direct**
Pour vérifier que l'API fonctionne :

```bash
# Test Option 1
curl -X POST http://localhost:8000/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "paul@test.com", "password": "123456"}'

# Test Option 2  
curl -X POST http://localhost:8000/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}'
```

Les deux doivent retourner des **tokens JWT valides**.

## 🐛 **Si le Login Frontend Échoue Encore**

### 1. **Vérifier la Console Browser**
Ouvre les **DevTools** (F12) → **Console**. Cherche :
- Messages d'erreur détaillés
- URL exacte appelée
- Headers de la requête

### 2. **Vérifier Network Tab**  
Dans **DevTools** → **Network** → essaie de te connecter, puis :
- Clique sur la requête `POST /v1/auth/login/`
- Vérifie les **Request Headers**
- Vérifie le **Request Payload**
- Vérifie la **Response**

### 3. **Vider le Cache**
Le frontend peut avoir des **tokens expirés** :
```javascript
// Dans Console Browser, execute:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### 4. **Test Incognito**
Teste en **mode navigation privée** pour éliminer les cookies/cache.

## 🔍 **Debug Avancé**

### Vérifier que l'API tourne bien
```bash
curl http://localhost:8000/v1/auth/login/ -X OPTIONS
# Doit retourner les OPTIONS CORS
```

### Vérifier CORS
Le frontend (port 3001) doit pouvoir accéder à l'API (port 8000). Dans les logs Django, tu dois voir :
```
[25/Sep/2025 12:37:36] "OPTIONS /v1/auth/login/ HTTP/1.1" 200 0
[25/Sep/2025 12:37:36] "POST /v1/auth/login/ HTTP/1.1" 200 892
```

**Pas** :
```
[25/Sep/2025 12:37:36] "POST /v1/auth/login/ HTTP/1.1" 401 63
```

## 🎯 **Étapes de Test**

1. **Lance le stack complet** :
   ```bash
   ./start-complete-stack.sh
   ```

2. **Va sur http://localhost:3001/auth/login**

3. **Utilise les credentials** :
   - Email: `paul@test.com`
   - Password: `123456`

4. **Si ça échoue**, check les **DevTools Console + Network**

5. **Envoie-moi les erreurs exactes** de la console

## 🚀 **Une fois connecté**

Tu devrais être redirigé vers :
- **Dashboard** : http://localhost:3001/dashboard
- **Ou Forms** : http://localhost:3001/forms

Et avoir accès à :
- **Marketing** : http://localhost:3000  
- **Builder** : http://localhost:3001
- **Runtime** : http://localhost:3002
- **API** : http://localhost:8000

---

**Teste avec `paul@test.com` / `123456` et dis-moi si ça fonctionne !** 🎉