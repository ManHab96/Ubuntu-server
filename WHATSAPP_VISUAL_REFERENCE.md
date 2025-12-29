# 📸 Referencia Visual: Meta for Developers

## Este documento complementa la guía principal con referencias visuales de dónde encontrar cada credencial

---

## 🎯 Ubicación de Credenciales en Meta for Developers

### 1. Phone Number ID

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Inicio rápido

**Dónde buscarlo:**
- Después de agregar tu número de teléfono
- Se muestra directamente debajo del número en formato internacional
- Aparece como: `Phone number ID: 123456789012345`

**Screenshot de referencia:**
```
┌─────────────────────────────────────────┐
│ Test number                              │
│ +1 555 025 0273                         │
│                                         │
│ Phone number ID                         │
│ 123456789012345          [Copy]        │
└─────────────────────────────────────────┘
```

---

### 2. Temporary Access Token

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Inicio rápido

**Dónde buscarlo:**
- En la misma página de "Inicio rápido"
- Sección: "Enviar y recibir mensajes"
- Se muestra como un texto largo que comienza con `EAA...`

**Screenshot de referencia:**
```
┌─────────────────────────────────────────┐
│ Temporary access token                  │
│ ⚠️  Expires in 23 hours                 │
│                                         │
│ EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxx...      │
│                             [Copy]      │
│                                         │
│ ℹ️  For production, generate a          │
│    permanent token                      │
└─────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** Este token expira en 24 horas. Solo úsalo para pruebas iniciales.

---

### 3. Business Account ID

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Configuración

**Dónde buscarlo:**
- Menú lateral izquierdo → WhatsApp → Configuración
- Primera sección de la página
- Aparece como: `WhatsApp Business Account ID`

**Screenshot de referencia:**
```
┌─────────────────────────────────────────┐
│ WhatsApp Business Account               │
│                                         │
│ Account ID                              │
│ 987654321098765          [Copy]        │
│                                         │
│ Account Name                            │
│ Agencia Automotriz Premier             │
└─────────────────────────────────────────┘
```

---

### 4. Configuración del Webhook

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Configuración → Webhook

**Dónde configurarlo:**
- En la misma página de "Configuración"
- Busca la sección "Webhook"
- Haz clic en "Configurar webhook" o "Editar"

**Formulario del Webhook:**
```
┌─────────────────────────────────────────────────┐
│ Edit webhook                                    │
│                                                 │
│ Callback URL *                                  │
│ https://tu-dominio.com/api/whatsapp/webhook   │
│                                                 │
│ Verify token *                                  │
│ mi_token_secreto_123                           │
│                                                 │
│         [Cancel]  [Verify and save]            │
└─────────────────────────────────────────────────┘
```

**Después de verificar, debes suscribirte a eventos:**
```
┌─────────────────────────────────────────┐
│ Webhook fields                          │
│                                         │
│ ☑️  messages                             │
│     Subscribe to message notifications  │
│                                         │
│ ☐  messaging_postbacks                  │
│     Subscribe to postback events        │
│                                         │
│ ☐  message_echoes                       │
│     Subscribe to message echoes         │
└─────────────────────────────────────────┘
```

**✅ IMPORTANTE:** Asegúrate de marcar ☑️ `messages`

---

## 🔐 Generar Token Permanente (Producción)

**Ubicación:** Meta Business Suite → Configuración → Usuarios del sistema

**Pasos:**

1. **Ir a Usuarios del sistema:**
```
Meta Business Suite
├─ Configuración empresarial (⚙️)
└─ Usuarios del sistema
```

2. **Crear usuario del sistema:**
```
┌─────────────────────────────────────────┐
│ Add System User                          │
│                                         │
│ Name *                                  │
│ WhatsApp API Bot                       │
│                                         │
│ Role *                                  │
│ ⚫ Admin                                 │
│                                         │
│         [Cancel]  [Create System User] │
└─────────────────────────────────────────┘
```

3. **Generar token:**
```
┌─────────────────────────────────────────┐
│ Generate new token                       │
│                                         │
│ App *                                   │
│ Asistente Virtual Automotriz ▼         │
│                                         │
│ Available Permissions:                  │
│ ☑️  whatsapp_business_management         │
│ ☑️  whatsapp_business_messaging          │
│                                         │
│         [Cancel]  [Generate Token]      │
└─────────────────────────────────────────┘
```

4. **Copiar token permanente:**
```
┌─────────────────────────────────────────┐
│ ⚠️  Copy this token now                  │
│                                         │
│ You won't be able to see it again      │
│                                         │
│ EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   │
│ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      │
│                             [Copy]      │
│                                         │
│              [Done]                     │
└─────────────────────────────────────────┘
```

**⚠️ CRÍTICO:** Copia y guarda este token inmediatamente. No podrás verlo de nuevo.

---

## 🧪 Agregar Números de Prueba

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Inicio rápido

**Cuándo usarlo:**
- Solo si estás usando el número de prueba de Meta
- Para poder enviar mensajes de prueba a tu WhatsApp personal

**Proceso:**
```
┌─────────────────────────────────────────┐
│ Step 3: Send and receive messages      │
│                                         │
│ Add a recipient phone number           │
│                                         │
│ Phone number *                          │
│ +52 ____ ____ ____                     │
│                                         │
│         [Cancel]  [Send Code]          │
└─────────────────────────────────────────┘
```

Recibirás un código por WhatsApp en tu teléfono personal:
```
WhatsApp Business Platform verification 
code: 123-456

Do not share this code.
```

Ingresa el código:
```
┌─────────────────────────────────────────┐
│ Verify phone number                     │
│                                         │
│ Enter the 6-digit code sent to          │
│ +52 XXX XXX XXXX                        │
│                                         │
│ Code *                                  │
│ [_][_][_][_][_][_]                     │
│                                         │
│         [Cancel]  [Verify]             │
└─────────────────────────────────────────┘
```

✅ Una vez verificado, puedes enviar mensajes de prueba a ese número.

---

## 📱 Probar el Envío de Mensajes

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Inicio rápido

**Herramienta de prueba integrada:**
```
┌─────────────────────────────────────────┐
│ Send a test message                     │
│                                         │
│ To: +52 XXX XXX XXXX        ▼          │
│                                         │
│ Message body:                           │
│ ┌─────────────────────────────────────┐│
│ │ Hello from WhatsApp Business!       ││
│ │                                     ││
│ └─────────────────────────────────────┘│
│                                         │
│              [Send message]             │
└─────────────────────────────────────────┘
```

Si recibes el mensaje, la configuración básica está correcta ✅

---

## 🔍 Verificar Estado del Webhook

**Ubicación:** Meta for Developers → Tu App → WhatsApp → Configuración → Webhook

**Indicadores de estado:**

✅ **Webhook activo:**
```
┌─────────────────────────────────────────┐
│ Webhook                                 │
│ ● Active                                │
│                                         │
│ Callback URL:                           │
│ https://tu-dominio.com/api/...         │
│                                         │
│ Last test: 2 minutes ago - Success ✅   │
│                                         │
│ [Edit]  [Test webhook]                 │
└─────────────────────────────────────────┘
```

❌ **Webhook con error:**
```
┌─────────────────────────────────────────┐
│ Webhook                                 │
│ ⚠️  Error                                │
│                                         │
│ Callback URL:                           │
│ https://tu-dominio.com/api/...         │
│                                         │
│ Last test: Failed - Could not connect  │
│                                         │
│ [Edit]  [Test webhook]                 │
└─────────────────────────────────────────┘
```

**Botón "Test webhook":**
- Envía una solicitud de prueba a tu webhook
- Útil para verificar que tu servidor está respondiendo correctamente

---

## 📊 Monitoreo de Mensajes

**Ubicación:** Meta for Developers → Tu App → Panel de control

**Métricas disponibles:**
```
┌─────────────────────────────────────────┐
│ WhatsApp Business API Usage             │
│                                         │
│ Messages sent today:          24        │
│ Messages received today:      18        │
│ Active conversations:          7        │
│                                         │
│ [View detailed analytics]              │
└─────────────────────────────────────────┘
```

---

## ⚠️ Errores Comunes y Soluciones

### Error 1: "Webhook verification failed"
```
❌ The callback URL or verify token couldn't be validated.
   Please check your webhook settings.
```

**Solución:**
1. Verifica que la URL sea HTTPS (no HTTP)
2. Verifica que el verify token en Meta coincida con el del panel
3. Revisa que tu servidor esté respondiendo correctamente

### Error 2: "Could not connect to webhook"
```
❌ We couldn't connect to your webhook URL.
```

**Solución:**
1. Verifica que tu servidor esté en línea
2. Si usas ngrok, asegúrate de que esté ejecutándose
3. Verifica que no haya firewall bloqueando Meta

### Error 3: "Invalid access token"
```
❌ The access token could not be validated.
```

**Solución:**
1. El token expiró (si es temporal)
2. Genera un nuevo token permanente
3. Actualiza el token en tu panel de configuración

---

## 📌 Checklist de Verificación Visual

Usa esta checklist cuando configures WhatsApp:

### En Meta for Developers:
- [ ] App creada con WhatsApp agregado
- [ ] Número de teléfono agregado (prueba o propio)
- [ ] Phone Number ID visible y copiado
- [ ] Access Token generado y copiado
- [ ] Business Account ID encontrado y copiado
- [ ] Webhook configurado con URL correcta
- [ ] Webhook verificado (estado "Active")
- [ ] Suscripción a "messages" activada
- [ ] Token permanente generado (para producción)

### En tu Panel:
- [ ] 4 credenciales ingresadas en Configuración → WhatsApp
- [ ] Configuración guardada exitosamente
- [ ] Mensaje ✅ de confirmación visible

### Pruebas:
- [ ] Mensaje de prueba enviado desde tu WhatsApp
- [ ] Respuesta del asistente IA recibida
- [ ] Cliente registrado en CRM
- [ ] Conversación visible en panel
- [ ] Dashboard actualizado con nuevo lead

---

## 🆘 ¿Necesitas Ayuda Adicional?

**Documentación oficial de Meta:**
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Webhooks: https://developers.facebook.com/docs/whatsapp/webhooks
- Autenticación: https://developers.facebook.com/docs/whatsapp/business-management-api/get-started

**Recursos de la plataforma:**
- Guía interactiva: Ve a "Guía: Configurar WhatsApp Business" en tu panel
- Documentación completa: `/WHATSAPP_SETUP_GUIDE.md` en tu proyecto

---

**¡Éxito con tu configuración! 🚀**
