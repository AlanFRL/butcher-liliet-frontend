# 📸 Instrucciones para Agregar Imágenes

## 🎯 Imágenes Necesarias

### 1. **Logo Principal** (Obligatorio)
- **Archivo:** `logo.png` o `logo.jpg`
- **Tamaño recomendado:** 200x200 píxeles (cuadrado)
- **Formato:** PNG con fondo transparente (recomendado) o JPG
- **Dónde aparece:**
  - Navbar (esquina superior izquierda) - 40x40px
  - Login (centro, encima del título) - 96x96px

### 2. **Imagen de Fondo Login** (Opcional)
- **Archivo:** `login-background.jpg` o `login-background.png`
- **Tamaño recomendado:** 1920x1080 píxeles o mayor
- **Formato:** JPG preferido (menor peso)
- **Dónde aparece:**
  - Pantalla de inicio de sesión (fondo con opacidad 20%)

---

## 📂 Dónde Colocar las Imágenes

### Paso 1: Localiza la carpeta `public`
```
frontend-pwa/
  └── public/           👈 AQUÍ van las imágenes
```

### Paso 2: Copia tus imágenes
Copia las imágenes directamente en la carpeta `public` con estos nombres **EXACTOS**:

```
frontend-pwa/
  └── public/
      ├── logo.png              👈 Tu logo principal
      └── login-background.jpg  👈 Tu imagen de fondo (opcional)
```

**⚠️ IMPORTANTE:** 
- Los nombres deben ser **exactamente** como se indica
- Si usas `.jpg` en lugar de `.png`, el código funcionará igual
- Las imágenes deben estar en la raíz de `public`, NO en subcarpetas

---

## ✅ Verificación

### Con las imágenes:
1. Logo aparece en navbar (40x40px, esquina superior izquierda)
2. Logo aparece en login (96x96px, centrado arriba)
3. Fondo de carne/negocio en pantalla de login (si agregaste `login-background.jpg`)

### Sin las imágenes (Fallback automático):
1. Navbar muestra un cuadro naranja con "BL"
2. Login muestra un cuadro naranja grande con "BL"
3. Fondo de login es el degradado azul oscuro (sin imagen)

---

## 🎨 Recomendaciones de Diseño

### Para el Logo (`logo.png`):
- ✅ Fondo transparente (PNG)
- ✅ Colores que contrasten con fondo azul oscuro
- ✅ Diseño simple y reconocible
- ✅ Alta resolución (mínimo 200x200px)
- ❌ Evitar detalles muy pequeños (se ve en tamaño reducido)

### Para el Fondo (`login-background.jpg`):
- ✅ Imágenes de carne, carnicería, productos
- ✅ Buena iluminación y alta calidad
- ✅ Composición horizontal (paisaje)
- ✅ Colores oscuros funcionan mejor (la imagen tiene 20% opacidad)
- ❌ Evitar imágenes muy claras (dificulta lectura del texto)

---

## 🔄 Aplicar los Cambios

Después de copiar las imágenes:

### Modo Desarrollo:
```bash
npm run dev
```
Recarga la página (F5) y verás tus imágenes

### Modo Producción:
```bash
npm run build
```
Las imágenes se copiarán automáticamente a la carpeta `dist`

---

## 📝 Nombres Alternativos Permitidos

Si necesitas usar otros nombres, el código acepta ambos formatos:
- `logo.png` o `logo.jpg`
- `login-background.png` o `login-background.jpg`

---

## ❓ Solución de Problemas

### Las imágenes no aparecen:
1. ✅ Verifica que estén en `frontend-pwa/public/`
2. ✅ Verifica los nombres exactos (con guiones, sin espacios)
3. ✅ Recarga con Ctrl+F5 (limpia caché)
4. ✅ Verifica que no haya subcarpetas: `public/logo.png` ✅ NO `public/imagenes/logo.png` ❌

### El logo se ve mal:
1. ✅ Aumenta la resolución de la imagen (mínimo 200x200px)
2. ✅ Usa PNG con fondo transparente
3. ✅ Ajusta colores para mejor contraste

### El fondo se ve muy oscuro:
1. ✅ Usa una imagen más clara
2. ✅ Ajusta brillo/contraste antes de subirla
3. ✅ Es opcional, puede verse bien sin fondo también

---

## 🎯 Resultado Final

Con tus imágenes correctamente colocadas verás:
- **Navbar:** Tu logo + "Butcher Lilieth" + "Carnes Premium"
- **Login:** Tu logo grande + título + fondo personalizado
- **Fallback:** Si falta alguna imagen, se muestra "BL" en cuadro naranja

¡Todo listo para personalizar! 🥩
