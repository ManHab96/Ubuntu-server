# 🚀 Tutorial: Hosting en Oracle Cloud VM con Ubuntu 22.04 LTS

## Guía completa para desplegar tu Agencia Automotriz con IA

---

## 📋 Requisitos Previos

1. Cuenta en Oracle Cloud (gratuita): https://cloud.oracle.com/
2. Acceso SSH desde tu computadora
3. Un dominio (opcional, pero recomendado)

---

## 🖥️ Paso 1: Crear la VM en Oracle Cloud

### 1.1 Acceder a Oracle Cloud Console
1. Ve a https://cloud.oracle.com/
2. Inicia sesión con tu cuenta
3. En el menú, ve a **Compute** → **Instances**

### 1.2 Crear una nueva instancia
1. Clic en **"Create Instance"**
2. Configura:
   - **Name**: `agencia-automotriz`
   - **Image**: Ubuntu 22.04 LTS (Canonical Ubuntu)
   - **Shape**: VM.Standard.E2.1.Micro (Always Free) o superior
   - **Networking**: Crear nueva VCN o usar existente
   - **Add SSH keys**: Sube tu clave pública SSH

3. Clic en **"Create"**

### 1.3 Configurar reglas de firewall (Security List)
1. Ve a **Networking** → **Virtual Cloud Networks**
2. Selecciona tu VCN → **Security Lists** → **Default Security List**
3. Agrega estas **Ingress Rules**:

| Puerto | Protocolo | Descripción |
|--------|-----------|-------------|
| 22     | TCP       | SSH         |
| 80     | TCP       | HTTP        |
| 443    | TCP       | HTTPS       |
| 8001   | TCP       | Backend API |
| 3000   | TCP       | Frontend    |

---

## 🔐 Paso 2: Conectarse a la VM

```bash
# Conectar vía SSH
ssh -i /ruta/a/tu/clave_privada ubuntu@<IP_PUBLICA_DE_TU_VM>

# Ejemplo:
ssh -i ~/.ssh/oracle_key ubuntu@129.151.xxx.xxx
```

---

## 📦 Paso 3: Instalar dependencias

### 3.1 Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.2 Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Debe mostrar v20.x.x
```

### 3.3 Instalar Python 3.11 y pip
```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
python3.11 --version  # Debe mostrar 3.11.x
```

### 3.4 Instalar MongoDB
```bash
# Importar clave GPG
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Agregar repositorio
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Iniciar y habilitar servicio
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

### 3.5 Instalar Nginx (proxy reverso)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 3.6 Instalar Yarn
```bash
sudo npm install -g yarn
```

### 3.7 Instalar PM2 (gestor de procesos)
```bash
sudo npm install -g pm2
```

---

## 📂 Paso 4: Descargar y configurar la aplicación

### 4.1 Clonar o subir el código
```bash
# Opción A: Clonar desde GitHub (si tienes el repo)
cd /home/ubuntu
git clone https://github.com/TU_USUARIO/agencia-automotriz.git
cd agencia-automotriz

# Opción B: Subir archivos con SCP
# Desde tu computadora local:
scp -i ~/.ssh/oracle_key -r ./app ubuntu@<IP_VM>:/home/ubuntu/agencia-automotriz
```

### 4.2 Configurar el Backend
```bash
cd /home/ubuntu/agencia-automotriz/backend

# Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=automotive_agency
CORS_ORIGINS=*
EMERGENT_LLM_KEY=tu_emergent_key_aqui
EOF
```

### 4.3 Configurar el Frontend
```bash
cd /home/ubuntu/agencia-automotriz/frontend

# Instalar dependencias
yarn install

# Crear archivo .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://tu-dominio.com
EOF

# Construir para producción
yarn build
```

---

## ⚙️ Paso 5: Configurar PM2 para ejecutar los servicios

### 5.1 Crear archivo de configuración PM2
```bash
cat > /home/ubuntu/agencia-automotriz/ecosystem.config.js << 'EOF'
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

### 5.2 Instalar serve para el frontend
```bash
cd /home/ubuntu/agencia-automotriz/frontend
yarn add serve
```

### 5.3 Iniciar servicios con PM2
```bash
cd /home/ubuntu/agencia-automotriz
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir las instrucciones que muestra
```

### 5.4 Verificar que los servicios estén corriendo
```bash
pm2 status
pm2 logs
```

---

## 🌐 Paso 6: Configurar Nginx como proxy reverso

### 6.1 Crear configuración de Nginx
```bash
sudo nano /etc/nginx/sites-available/agencia-automotriz
```

Pegar el siguiente contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    # O usa la IP: server_name 129.151.xxx.xxx;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Habilitar el sitio
```bash
sudo ln -s /etc/nginx/sites-available/agencia-automotriz /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx
```

---

## 🔒 Paso 7: Configurar SSL con Let's Encrypt (HTTPS)

### 7.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtener certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 7.3 Renovación automática
```bash
# Verificar que la renovación automática funcione
sudo certbot renew --dry-run
```

---

## 📱 Paso 8: Configurar WhatsApp Webhook

### 8.1 Actualizar URL en Meta for Developers
1. Ve a Meta for Developers → WhatsApp → Configuración → Webhook
2. URL del Webhook: `https://tu-dominio.com/api/whatsapp/webhook`
3. Verify Token: `Ventas123`

### 8.2 Actualizar .env del Frontend
```bash
# Editar /home/ubuntu/agencia-automotriz/frontend/.env
REACT_APP_BACKEND_URL=https://tu-dominio.com

# Reconstruir frontend
cd /home/ubuntu/agencia-automotriz/frontend
yarn build

# Reiniciar PM2
pm2 restart all
```

---

## 🔧 Paso 9: Comandos útiles de mantenimiento

### Ver logs
```bash
pm2 logs                    # Todos los logs
pm2 logs backend            # Solo backend
pm2 logs frontend           # Solo frontend
```

### Reiniciar servicios
```bash
pm2 restart all             # Reiniciar todo
pm2 restart backend         # Solo backend
pm2 restart frontend        # Solo frontend
```

### Ver estado
```bash
pm2 status                  # Estado de servicios
pm2 monit                   # Monitor en tiempo real
```

### Actualizar código
```bash
cd /home/ubuntu/agencia-automotriz
git pull                    # Si usas Git

# Reinstalar dependencias si es necesario
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd ../frontend && yarn install && yarn build

# Reiniciar
pm2 restart all
```

### Ver logs de MongoDB
```bash
sudo journalctl -u mongod -f
```

### Backup de base de datos
```bash
mongodump --db automotive_agency --out /home/ubuntu/backups/$(date +%Y%m%d)
```

---

## 🔥 Paso 10: Configurar Firewall (iptables)

```bash
# Permitir SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Permitir HTTP y HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Guardar reglas
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## ✅ Verificación Final

1. **Abrir en navegador**: `https://tu-dominio.com`
2. **Iniciar sesión**: `admin@agencia.com` / `admin123`
3. **Probar WhatsApp**: Enviar mensaje al número de WhatsApp Business
4. **Verificar calendario**: Crear una cita y verificar que aparezca

---

## 🆘 Solución de Problemas

### El backend no inicia
```bash
cd /home/ubuntu/agencia-automotriz/backend
source venv/bin/activate
python -c "import server"  # Ver errores de importación
```

### MongoDB no conecta
```bash
sudo systemctl status mongod
sudo journalctl -u mongod -n 50
```

### Nginx muestra error 502
```bash
# Verificar que backend esté corriendo
curl http://localhost:8001/api/health

# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log
```

### Certificado SSL no funciona
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## 📊 Recursos de Oracle Cloud Free Tier

- **2 VMs AMD** (1 GB RAM, 1 OCPU cada una)
- **4 VMs ARM** (24 GB RAM, 4 OCPUs total)
- **200 GB de almacenamiento**
- **10 TB de transferencia de datos/mes**

---

## 🎉 ¡Listo!

Tu aplicación de Agencia Automotriz con IA ahora está corriendo en Oracle Cloud.

**URL de tu aplicación**: `https://tu-dominio.com`
**Webhook de WhatsApp**: `https://tu-dominio.com/api/whatsapp/webhook`

---

*Documento generado el: Diciembre 2025*
*Versión: 1.0*
