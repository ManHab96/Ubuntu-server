# 🚀 Tutorial Completo: Hosting en Oracle Cloud VM

## Guía Paso a Paso para Desplegar la Agencia Automotriz con IA

---

# 📖 PARTE 1: CREAR CUENTA Y VM EN ORACLE CLOUD

---

## 🔹 Paso 1.1: Crear cuenta en Oracle Cloud (Gratis)

1. **Ir a**: https://www.oracle.com/cloud/free/
2. **Clic en**: "Start for free"
3. **Llenar el formulario**:
   - Email
   - País: México (o tu país)
   - Nombre completo
   - Contraseña
4. **Verificar email** (revisa tu bandeja de entrada)
5. **Agregar método de pago** (no te cobran, es solo verificación)
6. **Seleccionar región**: 
   - Recomendado: `US West (Phoenix)` o `Brazil East (Sao Paulo)`

> ⏱️ **Tiempo estimado**: 10-15 minutos

---

## 🔹 Paso 1.2: Acceder al Panel de Oracle Cloud

1. Ir a: https://cloud.oracle.com/
2. Iniciar sesión con tu cuenta
3. Verás el **Dashboard principal**

---

## 🔹 Paso 1.3: Crear la Máquina Virtual

### A) Ir a Compute > Instances

1. En el menú hamburguesa (☰) arriba a la izquierda
2. Clic en **Compute** → **Instances**
3. Clic en botón azul **"Create instance"**

### B) Configurar la instancia

```
┌─────────────────────────────────────────────────────────────┐
│  CREATE COMPUTE INSTANCE                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Name: agencia-automotriz-server                            │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Placement                                                   │
│  ☑ Always Free-eligible (mantener marcado)                  │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Image and shape                                             │
│  [Change image] → Canonical Ubuntu 22.04                    │
│  [Change shape] → VM.Standard.E2.1.Micro (Always Free)      │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Networking                                                  │
│  ☑ Create new virtual cloud network                         │
│  ☑ Create new public subnet                                 │
│  ☑ Assign a public IPv4 address                             │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Add SSH keys                                                │
│  ○ Generate a key pair for me  ← SELECCIONAR ESTA           │
│  ○ Upload public key files                                   │
│  ○ Paste public keys                                         │
│                                                              │
│  [Save private key] [Save public key] ← DESCARGAR AMBAS     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                    [Create] ← CLIC AQUÍ
```

### C) Descargar las llaves SSH

⚠️ **MUY IMPORTANTE**: Cuando selecciones "Generate a key pair for me":
1. Clic en **"Save private key"** → Guarda el archivo `.key`
2. Clic en **"Save public key"** → Guarda el archivo `.pub`
3. **Guarda estos archivos en un lugar seguro**, los necesitarás para conectarte

### D) Esperar a que la VM esté lista

- Estado: **PROVISIONING** → **RUNNING** (2-5 minutos)
- Copiar la **IP Pública** (la necesitarás)

```
Ejemplo de IP: 129.151.234.56
```

---

## 🔹 Paso 1.4: Abrir Puertos en el Firewall de Oracle

### A) Ir a la configuración de red

1. En la página de tu instancia, busca **"Primary VNIC"**
2. Clic en el nombre de la **Subnet**
3. Clic en **"Security Lists"**
4. Clic en **"Default Security List for..."**

### B) Agregar reglas de entrada (Ingress Rules)

Clic en **"Add Ingress Rules"** y agregar una por una:

```
┌────────────────────────────────────────────────────────────┐
│  REGLA 1: HTTP                                              │
│  Source CIDR: 0.0.0.0/0                                     │
│  Destination Port Range: 80                                 │
│  Description: HTTP                                          │
├────────────────────────────────────────────────────────────┤
│  REGLA 2: HTTPS                                             │
│  Source CIDR: 0.0.0.0/0                                     │
│  Destination Port Range: 443                                │
│  Description: HTTPS                                         │
├────────────────────────────────────────────────────────────┤
│  REGLA 3: Backend API                                       │
│  Source CIDR: 0.0.0.0/0                                     │
│  Destination Port Range: 8001                               │
│  Description: Backend API                                   │
├────────────────────────────────────────────────────────────┤
│  REGLA 4: Frontend                                          │
│  Source CIDR: 0.0.0.0/0                                     │
│  Destination Port Range: 3000                               │
│  Description: Frontend React                                │
└────────────────────────────────────────────────────────────┘
```

---

# 📖 PARTE 2: CONECTARSE A LA VM

---

## 🔹 Paso 2.1: Preparar la llave SSH

### En Windows (PowerShell o CMD):

```powershell
# Mover la llave a una carpeta segura
mkdir C:\Users\TU_USUARIO\.ssh
move C:\Users\TU_USUARIO\Downloads\ssh-key-*.key C:\Users\TU_USUARIO\.ssh\oracle_key.key
```

### En Mac/Linux (Terminal):

```bash
# Mover la llave
mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle_key.key

# Dar permisos correctos (IMPORTANTE)
chmod 600 ~/.ssh/oracle_key.key
```

---

## 🔹 Paso 2.2: Conectarse por SSH

### En Windows (PowerShell):

```powershell
ssh -i C:\Users\TU_USUARIO\.ssh\oracle_key.key ubuntu@TU_IP_PUBLICA
```

### En Mac/Linux:

```bash
ssh -i ~/.ssh/oracle_key.key ubuntu@TU_IP_PUBLICA
```

**Ejemplo real:**
```bash
ssh -i ~/.ssh/oracle_key.key ubuntu@129.151.234.56
```

### Primera conexión:
```
The authenticity of host '129.151.234.56' can't be established.
Are you sure you want to continue connecting (yes/no)? yes
```
Escribir **yes** y presionar Enter.

### Si la conexión es exitosa verás:
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1052-oracle x86_64)

ubuntu@agencia-automotriz-server:~$
```

---

# 📖 PARTE 3: INSTALAR TODO EL SOFTWARE

---

## 🔹 Paso 3.1: Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

⏱️ Esperar 2-3 minutos...

---

## 🔹 Paso 3.2: Instalar Node.js 20

```bash
# Descargar e instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
# Debe mostrar: v20.x.x

npm --version
# Debe mostrar: 10.x.x
```

---

## 🔹 Paso 3.3: Instalar Python 3.11

```bash
# Instalar Python y herramientas
sudo apt install -y python3.11 python3.11-venv python3-pip

# Verificar
python3.11 --version
# Debe mostrar: Python 3.11.x
```

---

## 🔹 Paso 3.4: Instalar MongoDB

```bash
# Paso 1: Importar la clave GPG
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Paso 2: Agregar el repositorio
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Paso 3: Actualizar e instalar
sudo apt update
sudo apt install -y mongodb-org

# Paso 4: Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Paso 5: Verificar que esté corriendo
sudo systemctl status mongod
```

Debe mostrar: **active (running)** en verde

---

## 🔹 Paso 3.5: Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 🔹 Paso 3.6: Instalar Yarn y PM2

```bash
# Instalar Yarn
sudo npm install -g yarn

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2
```

---

## 🔹 Paso 3.7: Abrir puertos en el firewall de Ubuntu

```bash
# Permitir tráfico HTTP
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT

# Permitir tráfico HTTPS
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Permitir Backend
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8001 -j ACCEPT

# Permitir Frontend
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT

# Guardar las reglas
sudo netfilter-persistent save
```

Si pide instalar netfilter-persistent:
```bash
sudo apt install -y iptables-persistent
# Responder "Yes" a las preguntas
```

---

# 📖 PARTE 4: SUBIR EL CÓDIGO DE LA APLICACIÓN

---

## 🔹 Paso 4.1: Descargar el código desde Emergent

En la plataforma Emergent:
1. Ir al proyecto
2. Clic en **"Download Code"** o **"Export"**
3. Se descargará un archivo `.zip`

---

## 🔹 Paso 4.2: Subir el código al servidor

### Desde tu computadora (nueva terminal):

**En Windows (PowerShell):**
```powershell
# Subir el archivo zip
scp -i C:\Users\TU_USUARIO\.ssh\oracle_key.key C:\Users\TU_USUARIO\Downloads\app.zip ubuntu@TU_IP:/home/ubuntu/
```

**En Mac/Linux:**
```bash
# Subir el archivo zip
scp -i ~/.ssh/oracle_key.key ~/Downloads/app.zip ubuntu@TU_IP:/home/ubuntu/
```

---

## 🔹 Paso 4.3: Descomprimir en el servidor

Volver a la terminal SSH del servidor:

```bash
# Ir al directorio home
cd /home/ubuntu

# Instalar unzip si no está
sudo apt install -y unzip

# Descomprimir
unzip app.zip

# Renombrar la carpeta (opcional)
mv app agencia-automotriz

# Ver contenido
ls agencia-automotriz/
# Debe mostrar: backend  frontend
```

---

# 📖 PARTE 5: CONFIGURAR EL BACKEND

---

## 🔹 Paso 5.1: Configurar el Backend

```bash
# Entrar a la carpeta del backend
cd /home/ubuntu/agencia-automotriz/backend

# Crear entorno virtual de Python
python3.11 -m venv venv

# Activar el entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🔹 Paso 5.2: Crear archivo .env del Backend

```bash
# Crear el archivo .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=automotive_agency
CORS_ORIGINS=*
EOF

# Verificar
cat .env
```

---

## 🔹 Paso 5.3: Probar que el Backend funciona

```bash
# Asegurarse de estar en el directorio correcto
cd /home/ubuntu/agencia-automotriz/backend

# Activar entorno virtual si no está activo
source venv/bin/activate

# Probar el servidor (Ctrl+C para detener)
uvicorn server:app --host 0.0.0.0 --port 8001
```

Si ves: `Uvicorn running on http://0.0.0.0:8001` → ¡Funciona!

Presiona **Ctrl+C** para detener.

---

# 📖 PARTE 6: CONFIGURAR EL FRONTEND

---

## 🔹 Paso 6.1: Instalar dependencias del Frontend

```bash
# Ir a la carpeta del frontend
cd /home/ubuntu/agencia-automotriz/frontend

# Instalar dependencias con Yarn
yarn install
```

⏱️ Esto toma 3-5 minutos...

---

## 🔹 Paso 6.2: Configurar .env del Frontend

**IMPORTANTE**: Reemplaza `TU_IP_PUBLICA` con la IP de tu servidor Oracle

```bash
# Crear archivo .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://TU_IP_PUBLICA
EOF

# Ejemplo con IP real:
# echo "REACT_APP_BACKEND_URL=http://129.151.234.56" > .env

# Verificar
cat .env
```

---

## 🔹 Paso 6.3: Construir el Frontend para producción

```bash
# Construir
yarn build
```

⏱️ Esto toma 2-3 minutos...

Cuando termine, verás una carpeta `build/`

---

## 🔹 Paso 6.4: Instalar servidor estático

```bash
# Instalar serve para servir archivos estáticos
yarn add serve
```

---

# 📖 PARTE 7: CONFIGURAR PM2 PARA EJECUTAR TODO

---

## 🔹 Paso 7.1: Crear archivo de configuración PM2

```bash
# Ir a la carpeta principal
cd /home/ubuntu/agencia-automotriz

# Crear archivo de configuración
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/home/ubuntu/agencia-automotriz/backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      interpreter: 'none',
      env: {
        MONGO_URL: 'mongodb://localhost:27017',
        DB_NAME: 'automotive_agency'
      }
    },
    {
      name: 'frontend',
      cwd: '/home/ubuntu/agencia-automotriz/frontend',
      script: 'node_modules/.bin/serve',
      args: '-s build -l 3000',
      interpreter: 'none'
    }
  ]
};
EOF
```

---

## 🔹 Paso 7.2: Iniciar los servicios

```bash
# Iniciar todo
pm2 start ecosystem.config.js

# Ver estado
pm2 status
```

Debe mostrar:
```
┌─────┬────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name       │ namespace   │ version │ mode    │ status   │
├─────┼────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ backend    │ default     │ N/A     │ fork    │ online   │
│ 1   │ frontend   │ default     │ N/A     │ fork    │ online   │
└─────┴────────────┴─────────────┴─────────┴─────────┴──────────┘
```

---

## 🔹 Paso 7.3: Configurar inicio automático

```bash
# Guardar configuración
pm2 save

# Configurar inicio con el sistema
pm2 startup

# PM2 mostrará un comando, COPIARLO Y EJECUTARLO
# Ejemplo:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

# 📖 PARTE 8: PROBAR LA APLICACIÓN

---

## 🔹 Paso 8.1: Probar en el navegador

Abrir en tu navegador:

```
http://TU_IP_PUBLICA:3000
```

Ejemplo: `http://129.151.234.56:3000`

---

## 🔹 Paso 8.2: Iniciar sesión

```
Email: admin@agencia.com
Contraseña: admin123
```

---

## 🔹 Paso 8.3: Configurar la API de IA

1. Ir a **Configuración** → **IA**
2. En "Tu propia API Key de Google", pegar:
   ```
   Tu API Key de Google AI Studio
   ```
3. Clic en **Guardar**

> 📝 Obtén tu API Key gratis en: https://aistudio.google.com/apikey

---

# 📖 PARTE 9: CONFIGURAR DOMINIO Y HTTPS (Opcional)

---

## 🔹 Paso 9.1: Configurar Nginx como proxy

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/agencia
```

Pegar este contenido (cambiar TU_IP o dominio):

```nginx
server {
    listen 80;
    server_name TU_IP_O_DOMINIO;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/agencia /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl reload nginx
```

Ahora puedes acceder en: `http://TU_IP` (sin puerto)

---

## 🔹 Paso 9.2: Configurar HTTPS con Let's Encrypt (si tienes dominio)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com
```

---

# 📖 PARTE 10: CONFIGURAR WHATSAPP

---

## 🔹 Paso 10.1: Actualizar URL del Webhook en Meta

1. Ir a: https://developers.facebook.com/
2. Tu App → WhatsApp → Configuración → Webhook
3. **URL del Webhook**:
   ```
   http://TU_IP/api/whatsapp/webhook
   ```
   O con HTTPS:
   ```
   https://tu-dominio.com/api/whatsapp/webhook
   ```
4. **Verify Token**: `Ventas123`
5. Clic en **Verificar y guardar**

---

# 📖 COMANDOS ÚTILES

---

## Ver logs
```bash
pm2 logs              # Todos los logs
pm2 logs backend      # Solo backend
pm2 logs frontend     # Solo frontend
```

## Reiniciar servicios
```bash
pm2 restart all       # Reiniciar todo
pm2 restart backend   # Solo backend
pm2 restart frontend  # Solo frontend
```

## Ver estado
```bash
pm2 status            # Estado de servicios
pm2 monit             # Monitor en tiempo real
```

## Detener servicios
```bash
pm2 stop all          # Detener todo
pm2 delete all        # Eliminar procesos
```

## Ver logs de errores del backend
```bash
pm2 logs backend --err --lines 100
```

## Reiniciar MongoDB
```bash
sudo systemctl restart mongod
```

## Ver espacio en disco
```bash
df -h
```

## Ver uso de memoria
```bash
free -h
```

---

# ✅ VERIFICACIÓN FINAL

| Paso | Verificar | Comando/URL |
|------|-----------|-------------|
| 1 | MongoDB corriendo | `sudo systemctl status mongod` |
| 2 | Backend corriendo | `pm2 status` → backend: online |
| 3 | Frontend corriendo | `pm2 status` → frontend: online |
| 4 | Web accesible | `http://TU_IP:3000` en navegador |
| 5 | Login funciona | admin@agencia.com / admin123 |
| 6 | API de IA configurada | Configuración → IA → API Key guardada |

---

# 🆘 SOLUCIÓN DE PROBLEMAS

## Error: "Connection refused" al acceder a la web
```bash
# Verificar que los servicios estén corriendo
pm2 status

# Verificar puertos abiertos
sudo iptables -L -n
```

## Error: Backend no inicia
```bash
# Ver logs del backend
pm2 logs backend --err --lines 50

# Verificar que MongoDB esté corriendo
sudo systemctl status mongod
```

## Error: Frontend muestra página en blanco
```bash
# Reconstruir frontend
cd /home/ubuntu/agencia-automotriz/frontend
yarn build
pm2 restart frontend
```

## Error: WhatsApp webhook no verifica
- Verificar que el puerto 80 esté abierto en Oracle Cloud Security List
- Verificar que Nginx esté corriendo: `sudo systemctl status nginx`

---

# 🎉 ¡LISTO!

Tu aplicación está corriendo en Oracle Cloud.

**Acceso**: `http://TU_IP_PUBLICA`
**Login**: admin@agencia.com / admin123

---

*Tutorial creado: Diciembre 2025*
*Para: Agencia Automotriz con IA*
