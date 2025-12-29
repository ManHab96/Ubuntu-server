# 🔐 Credenciales de Acceso - Plataforma Automotriz

## 📋 Cuentas Disponibles

### 👤 Cuenta 1: Administrador Principal
```
Email:      admin@agencia.com
Contraseña: admin123
Rol:        Admin
```

### 👤 Cuenta 2: Usuario Demo
```
Email:      usuario@agencia.com
Contraseña: usuario123
Rol:        Admin
```

---

## 🌐 Acceso a la Plataforma

**URL:** http://localhost:3000 (desarrollo local)

**En producción:** https://tu-dominio.emergent.sh

---

## ✨ Nuevas Funcionalidades de Gestión de Usuarios

### 1️⃣ Editar Perfil

**Cómo acceder:**
1. Inicia sesión con cualquier cuenta
2. Haz clic en tu avatar/nombre en la esquina superior derecha
3. Selecciona **"Mi Perfil"** del menú desplegable

**Qué puedes hacer:**
- ✏️ Cambiar tu nombre completo
- ✏️ Actualizar tu correo electrónico
- 🔒 Cambiar tu contraseña
- 👁️ Ver tu rol y permisos

**⚠️ Importante:**
- Si cambias tu email, deberás iniciar sesión nuevamente
- La contraseña debe tener al menos 6 caracteres
- Necesitas tu contraseña actual para cambiarla

---

### 2️⃣ Restablecer Contraseña Olvidada

**Desde el Login:**
1. En la página de inicio de sesión, haz clic en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu correo electrónico
3. Haz clic en **"Enviar"**

**En Modo Demo:**
- El sistema te mostrará un link directo para restablecer la contraseña
- En producción, este link llegaría a tu correo electrónico

**Usando el Link de Restablecimiento:**
1. Accede al link proporcionado
2. Ingresa tu nueva contraseña (mínimo 6 caracteres)
3. Confirma la nueva contraseña
4. Haz clic en **"Restablecer Contraseña"**
5. Serás redirigido al login automáticamente

---

## 🔒 Cambiar Contraseña (Estando Autenticado)

**Opción 1: Desde tu Perfil**
1. Ve a **Mi Perfil** (menú usuario → Mi Perfil)
2. Desplázate a la sección **"Cambiar Contraseña"**
3. Ingresa:
   - Contraseña actual
   - Nueva contraseña
   - Confirmar nueva contraseña
4. Haz clic en **"Cambiar Contraseña"**

---

## 🛡️ Seguridad

### Tokens de Sesión
- **Duración:** 24 horas
- **Tipo:** JWT (JSON Web Token)
- **Almacenamiento:** LocalStorage del navegador
- **Cierre de sesión:** Limpia el token automáticamente

### Tokens de Restablecimiento
- **Duración:** 30 minutos
- **Uso único:** Se invalida después de usarse
- **Expiración:** Se elimina automáticamente después de 30 minutos

### Contraseñas
- **Almacenamiento:** Hasheadas con bcrypt
- **Longitud mínima:** 6 caracteres
- **Validación:** Lado cliente y servidor

---

## 📧 Configurar Email Real (Producción)

Actualmente, el sistema muestra los tokens de restablecimiento en consola (modo demo).

**Para configurar email real:**

1. **Opción A: SendGrid**
```python
# En /app/backend/routes/auth.py
import sendgrid
from sendgrid.helpers.mail import Mail

sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))

def send_reset_email(email, reset_url):
    message = Mail(
        from_email='noreply@tuagencia.com',
        to_emails=email,
        subject='Restablecer Contraseña',
        html_content=f'<p>Haz clic aquí para restablecer: <a href="{reset_url}">{reset_url}</a></p>'
    )
    sg.send(message)
```

2. **Opción B: Resend (recomendado)**
```python
import resend

resend.api_key = os.environ.get('RESEND_API_KEY')

def send_reset_email(email, reset_url):
    resend.Emails.send({
        "from": "noreply@tuagencia.com",
        "to": email,
        "subject": "Restablecer Contraseña",
        "html": f"<p>Haz clic aquí: <a href='{reset_url}'>{reset_url}</a></p>"
    })
```

3. **Agregar a .env:**
```bash
SENDGRID_API_KEY=tu_api_key_aqui
# o
RESEND_API_KEY=tu_api_key_aqui
```

---

## 🧪 Pruebas de Funcionalidad

### Test 1: Editar Perfil
1. Login con `usuario@agencia.com` / `usuario123`
2. Ir a Mi Perfil
3. Cambiar nombre a "Usuario Actualizado"
4. Guardar cambios
5. Verificar que se actualiza en el topbar

### Test 2: Cambiar Contraseña
1. Login con cualquier cuenta
2. Ir a Mi Perfil → Cambiar Contraseña
3. Ingresar contraseña actual
4. Ingresar nueva contraseña: `nuevapass123`
5. Confirmar nueva contraseña
6. Guardar cambios
7. Cerrar sesión
8. Intentar login con contraseña antigua (debería fallar)
9. Login con nueva contraseña (debería funcionar)

### Test 3: Restablecer Contraseña
1. Logout (si estás autenticado)
2. En login, clic en "¿Olvidaste tu contraseña?"
3. Ingresar email: `admin@agencia.com`
4. Copiar el link/token mostrado
5. Navegar al link de restablecimiento
6. Ingresar nueva contraseña
7. Confirmar cambio
8. Login con nueva contraseña

---

## 🔧 Endpoints API Disponibles

### Autenticación
```
POST   /api/auth/register          - Registrar nuevo usuario
POST   /api/auth/login             - Iniciar sesión
GET    /api/auth/me                - Obtener usuario actual
PUT    /api/auth/profile           - Actualizar perfil
POST   /api/auth/change-password   - Cambiar contraseña (autenticado)
POST   /api/auth/reset-password-request  - Solicitar reset
POST   /api/auth/reset-password    - Confirmar reset con token
```

---

## 📊 Monitoreo

### Logs de Restablecimiento
Los tokens de restablecimiento se muestran en los logs del backend:

```bash
tail -f /var/log/supervisor/backend.out.log
```

Verás algo como:
```
🔐 Password reset requested for usuario@agencia.com
Reset URL: /reset-password?token=abc123-def456
Token: abc123-def456
```

---

## 🎯 Mejoras Futuras Sugeridas

1. **Verificación de Email por 2FA**
   - Código de 6 dígitos enviado por email
   - Validación en 2 pasos

2. **Historial de Cambios de Contraseña**
   - Registro de cuándo se cambió
   - Notificación por email al cambiar

3. **Políticas de Contraseña Más Estrictas**
   - Mayúsculas, minúsculas, números
   - Caracteres especiales
   - Longitud mínima de 8 caracteres

4. **Bloqueo de Cuenta por Intentos Fallidos**
   - Máximo 5 intentos fallidos
   - Bloqueo temporal de 15 minutos

5. **Sesiones Múltiples**
   - Ver dispositivos activos
   - Cerrar sesión en todos los dispositivos

---

## ✅ Checklist de Implementación

### Backend ✅
- [x] Endpoint de cambio de contraseña
- [x] Endpoint de actualización de perfil
- [x] Sistema de tokens de restablecimiento
- [x] Validación de contraseña actual
- [x] Hashing seguro con bcrypt
- [x] Expiración de tokens (30 min)

### Frontend ✅
- [x] Página de perfil de usuario
- [x] Formulario de edición de datos
- [x] Formulario de cambio de contraseña
- [x] Diálogo "Olvidé mi contraseña"
- [x] Página de restablecimiento con token
- [x] Menú desplegable en topbar
- [x] Validaciones lado cliente
- [x] Mensajes de confirmación

### UX ✅
- [x] Credenciales demo visibles en login
- [x] Mensajes claros de error/éxito
- [x] Redirección automática después de cambios
- [x] Confirmaciones antes de acciones críticas
- [x] Indicadores de carga

---

## 📞 Soporte

Si tienes problemas con el acceso:
1. Verifica que las credenciales sean correctas
2. Revisa los logs del backend para errores
3. Intenta restablecer la contraseña
4. Verifica que el token JWT no haya expirado (24h)

**Logs importantes:**
```bash
# Backend
tail -f /var/log/supervisor/backend.err.log

# Frontend
# Abre la consola del navegador (F12)
```

---

**¡Tu sistema de gestión de usuarios está completo y funcionando! 🎉**
