# 📱 Guía Completa: Configuración de WhatsApp Business Cloud API

## 🎯 Objetivo
Conectar tu agencia automotriz con WhatsApp Business Cloud API para que el asistente virtual con IA pueda atender clientes automáticamente.

---

## 📋 Requisitos Previos

✅ Cuenta de Facebook Business (gratuita)  
✅ Número de teléfono dedicado (no puede estar registrado en WhatsApp personal)  
✅ Dominio público o túnel HTTPS (ngrok para pruebas)  

---

## 🚀 PASO 1: Crear Meta Business Account

### 1.1 Acceder a Meta Business Suite
1. Ve a: **https://business.facebook.com**
2. Haz clic en **"Crear cuenta"**
3. Completa los datos:
   - Nombre de tu negocio: `Agencia Automotriz [Tu Nombre]`
   - Tu nombre
   - Tu correo electrónico empresarial

### 1.2 Verificar tu negocio
- Meta te enviará un código de verificación
- Ingresa el código para activar tu cuenta

✅ **Resultado:** Tienes tu Meta Business Account activa

---

## 🔧 PASO 2: Configurar WhatsApp Business API

### 2.1 Acceder a Meta for Developers
1. Ve a: **https://developers.facebook.com**
2. Inicia sesión con tu cuenta de Facebook
3. Haz clic en **"Mis Apps"** (esquina superior derecha)
4. Haz clic en **"Crear App"**

### 2.2 Configurar la App
1. Selecciona tipo: **"Empresa"**
2. Completa:
   - **Nombre para mostrar:** `Asistente Virtual Automotriz`
   - **Correo de contacto:** Tu email
   - **Business Account:** Selecciona la cuenta creada en Paso 1
3. Haz clic en **"Crear app"**

### 2.3 Agregar WhatsApp al Proyecto
1. En el panel de la app, busca **"WhatsApp"**
2. Haz clic en **"Configurar"**
3. Selecciona o crea una **Meta Business Account**
4. Confirma

✅ **Resultado:** WhatsApp Business API está agregada a tu app

---

## 📱 PASO 3: Configurar Número de WhatsApp

### 3.1 Agregar Número de Teléfono
1. En el panel de WhatsApp, ve a **"Inicio rápido"**
2. Sección **"Número de teléfono"**:
   - **Opción A - Número de prueba (recomendado para inicio):**
     - Meta te proporciona un número temporal
     - Puedes agregar hasta 5 números de prueba
     - **Nota:** Solo puedes enviar mensajes a números verificados
   
   - **Opción B - Tu propio número:**
     - Haz clic en **"Agregar número de teléfono"**
     - Ingresa tu número (formato internacional: +52...)
     - Recibirás un código por SMS
     - Ingresa el código para verificar

### 3.2 Obtener Credenciales (IMPORTANTE)
En la sección de **"Inicio rápido"**, encontrarás:

📋 **PHONE NUMBER ID:**
```
Ejemplo: 123456789012345
```
- Se encuentra bajo el número de teléfono
- Cópialo, lo necesitarás más adelante

📋 **TEMPORARY ACCESS TOKEN:**
```
Ejemplo: EAAxxxxxxxxxxxxxxxxxxxxx
```
- Válido por 24 horas (solo para pruebas)
- Para producción, necesitarás generar un token permanente

📋 **BUSINESS ACCOUNT ID:**
```
Ejemplo: 987654321098765
```
- Se encuentra en Configuración → WhatsApp Business Account

✅ **Resultado:** Tienes tus 3 credenciales principales

---

## 🔗 PASO 4: Configurar Webhook

### 4.1 ¿Qué es un Webhook?
Un webhook es una URL pública donde Meta enviará los mensajes que recibe tu número de WhatsApp.

### 4.2 Exponer tu Servidor Local (Para Pruebas)

#### Opción A: Usar ngrok (Recomendado)
1. Descarga ngrok: **https://ngrok.com/download**
2. Instala y ejecuta:
   ```bash
   ngrok http 8001
   ```
3. Copia la URL HTTPS generada:
   ```
   Ejemplo: https://abc123.ngrok.io
   ```

#### Opción B: Usar Emergent Domain (Producción)
Si ya deployaste en Emergent, usa tu dominio:
```
https://tu-app.emergent.sh
```

### 4.3 Configurar Webhook en Meta
1. Ve a tu app en **Meta for Developers**
2. Panel lateral → **WhatsApp** → **Configuración**
3. Sección **"Webhook"**:
   - Haz clic en **"Configurar webhook"**

4. Completa el formulario:
   ```
   URL de devolución de llamada:
   https://tu-dominio.com/api/whatsapp/webhook
   
   Token de verificación:
   mi_token_secreto_123
   ```
   
   ⚠️ **IMPORTANTE:** El token de verificación puede ser cualquier texto que tú elijas. Debes guardarlo porque lo usarás en tu panel de configuración.

5. Haz clic en **"Verificar y guardar"**

### 4.4 Suscribirse a Eventos
Después de verificar el webhook, debes suscribirte a eventos:

1. En la misma página de **Configuración de Webhook**
2. Haz clic en **"Administrar"**
3. Suscríbete a:
   - ✅ `messages` (obligatorio)
   - ✅ `message_status` (opcional, para confirmaciones)

4. Haz clic en **"Guardar"**

✅ **Resultado:** Tu webhook está configurado y activo

---

## 🔐 PASO 5: Generar Token de Acceso Permanente

El token temporal expira en 24 horas. Para producción:

### 5.1 Crear Token del Sistema
1. Ve a **Configuración** → **Usuarios del sistema**
2. Haz clic en **"Agregar"**
3. Nombre: `WhatsApp API Token`
4. Rol: **Administrador**
5. Haz clic en **"Crear usuario del sistema"**

### 5.2 Generar Token
1. Haz clic en **"Generar nuevo token"**
2. Selecciona tu app
3. Permisos necesarios:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
4. Haz clic en **"Generar token"**
5. **COPIA EL TOKEN INMEDIATAMENTE** (no podrás verlo de nuevo)

📋 **TOKEN PERMANENTE:**
```
Ejemplo: EAAxxxxxxxxxxxxxxxxxxxxx (este no expira)
```

✅ **Resultado:** Tienes un token de acceso permanente

---

## ⚙️ PASO 6: Configurar en tu Panel Administrativo

### 6.1 Acceder a Configuración
1. Inicia sesión en tu panel: **https://tu-dominio.com**
2. Ve a **Configuración** (menú lateral)
3. Pestaña **"WhatsApp"**

### 6.2 Ingresar Credenciales
Completa los campos con los datos obtenidos:

```
📱 Phone Number ID:
[Pega aquí el Phone Number ID del Paso 3]

🔑 Access Token:
[Pega aquí el Token Permanente del Paso 5]

🏢 Business Account ID:
[Pega aquí el Business Account ID del Paso 3]

🔐 Verify Token:
[Pega aquí el token que elegiste en el Paso 4.3]
```

### 6.3 Guardar Configuración
- Haz clic en **"Guardar Configuración"**
- Verás un mensaje de éxito

✅ **Resultado:** Tu panel está conectado con WhatsApp

---

## 🧪 PASO 7: Probar la Integración

### 7.1 Agregar Número de Prueba (Solo con número temporal de Meta)
Si usas el número de prueba de Meta:

1. Ve a **Meta for Developers** → Tu App → **WhatsApp** → **Inicio rápido**
2. Sección **"Enviar y recibir mensajes"**
3. Haz clic en **"Agregar número de destinatario"**
4. Ingresa tu número personal de WhatsApp
5. Recibirás un código por WhatsApp
6. Ingresa el código para verificar

### 7.2 Enviar Mensaje de Prueba
1. Desde tu WhatsApp personal, envía un mensaje al número configurado:
   ```
   Hola, quisiera información sobre autos disponibles
   ```

2. **Espera la respuesta del asistente virtual**

### 7.3 Verificar en el Panel
1. Ve a **Conversaciones** en tu panel
2. Deberías ver:
   - Tu número listado
   - El historial del mensaje enviado
   - La respuesta del asistente

✅ **Resultado:** ¡Tu asistente virtual está funcionando!

---

## 📊 PASO 8: Monitoreo y Validación

### 8.1 Verificar Logs
En tu servidor, revisa los logs:
```bash
tail -f /var/log/supervisor/backend.out.log
```

Deberías ver:
```
INFO: Mensaje recibido de: +52...
INFO: Respuesta generada por IA
INFO: Mensaje enviado exitosamente
```

### 8.2 Verificar Base de Datos
1. Ve a **Clientes** en tu panel
2. Deberías ver tu número registrado automáticamente
3. Fuente: `organic`

### 8.3 Verificar Dashboard
1. Ve a **Dashboard**
2. **Leads Totales** debería incrementarse

---

## 🚨 Solución de Problemas Comunes

### ❌ Problema 1: Webhook no verifica
**Causa:** URL incorrecta o token no coincide

**Solución:**
1. Verifica que la URL sea HTTPS
2. Verifica que el token en Meta coincida con el del panel
3. Revisa logs del servidor: `tail -f /var/log/supervisor/backend.err.log`

### ❌ Problema 2: No recibo mensajes
**Causa:** Webhook no suscrito a eventos

**Solución:**
1. Ve a Meta for Developers → Configuración de Webhook
2. Verifica suscripción a `messages`
3. Vuelve a guardar

### ❌ Problema 3: No puedo enviar mensajes
**Causa:** Token expirado o permisos insuficientes

**Solución:**
1. Verifica que el token sea permanente (Paso 5)
2. Verifica permisos del token
3. Regenera el token si es necesario

### ❌ Problema 4: IA no responde
**Causa:** API Key de Gemini no configurada

**Solución:**
1. Ve a **Configuración** → **IA**
2. Verifica que GEMINI_API_KEY esté configurada
3. O activa EMERGENT_LLM_KEY

---

## 📈 PASO 9: Pasar a Producción

### 9.1 Checklist Pre-Producción
- ✅ Número de WhatsApp propio (no de prueba)
- ✅ Token de acceso permanente configurado
- ✅ Webhook en dominio HTTPS estable
- ✅ Gemini API Key configurada
- ✅ Pruebas exitosas de mensajes entrantes/salientes
- ✅ Prompt de IA personalizado
- ✅ Inventario de autos cargado
- ✅ Promociones activas configuradas

### 9.2 Verificación de Negocio (Opcional pero Recomendado)
Para enviar mensajes a cualquier usuario:

1. Ve a **Meta Business Suite**
2. Solicita **verificación de negocio**
3. Sube documentación requerida
4. Espera aprobación (1-3 días)

### 9.3 Monitoreo Continuo
- Revisa **Conversaciones** diariamente
- Monitorea **Dashboard** para métricas
- Ajusta **Prompt de IA** según necesidades

---

## 🎯 Resumen de Credenciales Necesarias

| Credencial | Dónde Obtenerla | Dónde Usarla |
|------------|----------------|-------------|
| **Phone Number ID** | Meta Developers → WhatsApp → Inicio rápido | Panel → Configuración → WhatsApp |
| **Access Token** | Meta Developers → Usuarios del sistema | Panel → Configuración → WhatsApp |
| **Business Account ID** | Meta Developers → WhatsApp → Configuración | Panel → Configuración → WhatsApp |
| **Verify Token** | Tú lo creas (cualquier texto) | Panel → Configuración → WhatsApp |
| **Gemini API Key** | EMERGENT_LLM_KEY (ya disponible) | Panel → Configuración → IA |

---

## 📞 Soporte

Si tienes problemas:
1. Revisa esta guía paso a paso
2. Verifica logs del servidor
3. Consulta documentación oficial de Meta: https://developers.facebook.com/docs/whatsapp

---

## ✅ ¡Listo!

Si completaste todos los pasos, tu asistente virtual debería estar:
- ✅ Recibiendo mensajes por WhatsApp
- ✅ Respondiendo con IA contextual
- ✅ Registrando clientes automáticamente
- ✅ Agendando citas cuando corresponda
- ✅ Compartiendo información de autos y promociones

**¡Tu agencia automotriz ya está operando 24/7 con IA! 🚀**
