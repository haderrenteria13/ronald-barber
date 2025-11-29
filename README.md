<p align="center">
  <img src="./public/og-image.png" width="120" alt="Ronald Barber Logo" />
</p>

<p align="center">
  Sistema de reservas online para barbería construido con <strong>Next.js 16</strong>, <strong>Supabase</strong> y <strong>TypeScript</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.0.4-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-2.85.0-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

---

## 📋 Descripción

**Ronald Barber** es una aplicación web moderna y premium para la gestión de citas de barbería. Permite a los clientes reservar servicios de forma intuitiva y al administrador gestionar horarios, citas y días bloqueados desde un panel de control elegante.

### ✨ Características Principales

#### Para Clientes

- 🎨 **Interfaz Premium**: Diseño mobile-first con animaciones fluidas y estética moderna
- 📅 **Reserva en 3 Pasos**: Selección de servicio → Fecha/Hora → Confirmación
- ⏰ **Disponibilidad en Tiempo Real**: Visualización de horarios disponibles según configuración del negocio
- 💬 **Confirmación por WhatsApp**: Notificación automática al cliente tras la reserva
- 🚫 **Validación Inteligente**: Prevención de reservas en horarios ocupados, días bloqueados o fuera del horario laboral

#### Para Administradores

- 🔐 **Panel Seguro**: Autenticación con Supabase y protección mediante middleware
- 📊 **Dashboard Intuitivo**: Vista de citas del día, próximas y pasadas con estadísticas
- ⚙️ **Gestión de Horarios**: Configuración de horarios semanales y descansos por día
- 🗓️ **Bloqueo de Fechas**: Marcar días no laborables o vacaciones
- 🎯 **Modales Personalizados**: Sin alertas nativas del navegador, todo con UI premium
- 🛡️ **Rate Limiting**: Protección contra spam en endpoints críticos

---

## 🚀 Tecnologías

### Frontend

- **Next.js 16** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **Lucide React** - Iconos modernos
- **date-fns** - Manipulación de fechas
- **react-day-picker** - Selector de calendario

### Backend & Base de Datos

- **Supabase** - Backend as a Service (PostgreSQL + Auth)
- **@supabase/ssr** - Autenticación en servidor
- **Next.js API Routes** - Endpoints serverless

### Integraciones

- **WhatsApp Bot** - Notificaciones automáticas ([Ver repositorio](https://github.com/haderrenteria13/whatsapp-bot))

---

## 📦 Instalación

### Prerrequisitos

- Node.js
- pnpm (recomendado) o npm
- Cuenta de Supabase
- Servidor de WhatsApp Bot configurado

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ronald-barber.git
cd ronald-barber
```

### 2. Instalar dependencias

```bash
pnpm install
# o
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WhatsApp Bot
WHATSAPP_BOT_URL=http://localhost:3001
```

### 4. Configurar la base de datos

Ejecuta los siguientes scripts SQL en el **SQL Editor** de Supabase:

#### Crear tablas principales

```sql
-- Servicios
create table services (
  id bigserial primary key,
  name text not null,
  price integer not null,
  duration integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Citas
create table appointments (
  id bigserial primary key,
  service_id bigint references services(id),
  client_name text not null,
  client_phone text not null,
  notes text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Horarios de negocio
create table business_hours (
  id bigserial primary key,
  day_of_week integer not null unique,
  start_time text not null,
  end_time text not null,
  break_start text,
  break_end text,
  is_active boolean default true
);

-- Fechas bloqueadas
create table blocked_dates (
  id bigserial primary key,
  date date not null unique,
  reason text
);

-- Rate limiting
create table rate_limits (
  ip text primary key,
  count integer default 0,
  last_request timestamp with time zone default timezone('utc'::text, now())
);
```

#### Configurar políticas de seguridad (RLS)

```sql
-- Habilitar RLS en todas las tablas
alter table services enable row level security;
alter table appointments enable row level security;
alter table business_hours enable row level security;
alter table blocked_dates enable row level security;
alter table rate_limits enable row level security;

-- Políticas públicas de lectura
create policy "Public read services" on services for select using (true);
create policy "Public read business_hours" on business_hours for select using (true);
create policy "Public read blocked_dates" on blocked_dates for select using (true);
create policy "Public read appointments" on appointments for select using (true);

-- Políticas de escritura (solo autenticados)
create policy "Authenticated insert appointments" on appointments for insert with check (true);
create policy "Authenticated update appointments" on appointments for update using (true);

-- Rate limiting (acceso público)
create policy "Public access rate_limits" on rate_limits for all using (true) with check (true);
```

### 5. Insertar datos de ejemplo (opcional)

```sql
-- Servicios
insert into services (name, price, duration) values
  ('Corte de Cabello', 25000, 30),
  ('Corte + Barba', 35000, 45),
  ('Corte + Pintura', 45000, 60);

-- Horarios (Lunes a Viernes: 9am-7pm, Descanso: 1pm-2pm)
insert into business_hours (day_of_week, start_time, end_time, break_start, break_end, is_active) values
  (1, '09:00', '19:00', '13:00', '14:00', true),
  (2, '09:00', '19:00', '13:00', '14:00', true),
  (3, '09:00', '19:00', '13:00', '14:00', true),
  (4, '09:00', '19:00', '13:00', '14:00', true),
  (5, '09:00', '19:00', '13:00', '14:00', true),
  (6, '09:00', '15:00', null, null, true),
  (0, '09:00', '19:00', null, null, false);
```

### 6. Configurar el Bot de WhatsApp

Para que las notificaciones funcionen, necesitas configurar el bot de WhatsApp:

1. **Clona el repositorio del bot:**

   ```bash
   git clone https://github.com/haderrenteria13/whatsapp-bot.git
   cd whatsapp-bot
   ```

2. **Sigue las instrucciones del README del bot** para:

   - Instalar dependencias
   - Configurar variables de entorno
   - Vincular tu cuenta de WhatsApp
   - Ejecutar el servidor del bot

3. **Asegúrate de que el bot esté corriendo** en `http://localhost:3001` (o la URL que hayas configurado en `WHATSAPP_BOT_URL`) espera a que te genere el codigo QR para vincular tu cuenta de WhatsApp.

> 📝 **Nota:** El bot debe estar ejecutándose para que las confirmaciones de citas se envíen por WhatsApp. Si no lo configuras, la aplicación seguirá funcionando pero sin notificaciones.

### 7. Ejecutar en desarrollo

```bash
pnpm dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🏗️ Estructura del Proyecto

```
ronald-barber/
├── app/                          # App Router de Next.js
│   ├── admin/                   # Rutas protegidas del administrador
│   │   ├── dashboard/          # Panel principal
│   │   ├── settings/           # Configuración de horarios
│   │   └── page.tsx            # Login
│   ├── api/                    # API Routes
│   │   └── send-confirmation/  # Endpoint de WhatsApp
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout raíz (SEO, metadatos)
│   └── page.tsx                # Página principal (reservas)
├── components/                  # Componentes reutilizables
│   ├── confirmationScreen/     # Pantalla de confirmación
│   ├── contactForm/            # Formulario de datos del cliente
│   ├── navBar/                 # Barra de navegación
│   ├── serviceSelector/        # Selector de servicios
│   └── timeSelector/           # Selector de fecha/hora
├── lib/                        # Utilidades y configuración
│   ├── supabase/
│   │   └── server.ts          # Cliente Supabase para servidor
│   ├── rate-limit.ts          # Lógica de rate limiting
│   ├── supabase.ts            # Cliente Supabase para browser
│   └── utils.ts               # Utilidades generales
├── public/                     # Assets estáticos
│   ├── cortes/                # Imágenes de servicios
│   ├── logo2.png              # Logo de la barbería
│   └── og-image.png           # Imagen para Open Graph
├── middleware.ts              # Middleware de autenticación
└── package.json
```

---

## 🔒 Seguridad

### Autenticación

- **Supabase Auth**: Sistema de autenticación robusto con JWT
- **Middleware de Next.js**: Protección de rutas `/admin` a nivel de servidor
- **Row Level Security (RLS)**: Políticas de seguridad en Supabase

### Rate Limiting

- Límite de **3 peticiones por minuto** en endpoint de confirmación
- Tracking por IP usando tabla en Supabase
- Estrategia "Fail Open" para no afectar el negocio en caso de errores

### Validaciones

- Validación de horarios en cliente y servidor
- Prevención de reservas duplicadas
- Sanitización de inputs de usuario

---

## 🎨 Características de Diseño

- **Mobile-First**: Diseñado primero para dispositivos móviles
- **Animaciones Fluidas**: Transiciones suaves con Tailwind CSS
- **Modales Personalizados**: Sin alertas nativas del navegador
- **Feedback Visual**: Estados de carga, éxito y error claros
- **Accesibilidad**: Semántica HTML correcta y navegación por teclado

---

## 📱 SEO y Compartir en Redes

El proyecto incluye configuración completa de metadatos:

- **Open Graph**: Tarjetas visuales al compartir en WhatsApp/Facebook
- **Twitter Cards**: Previsualización en Twitter
- **Metadatos dinámicos**: Títulos y descripciones optimizados

---

## 🚀 Despliegue

### Vercel

Para el despliegue use Vercel aqui te dejo los pasos para hacerlo:

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno en el dashboard
3. Deploy automático en cada push a `main`

### Variables de entorno en producción

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_APP_URL=link_de_tu_app
WHATSAPP_BOT_URL=https://tu-bot-whatsapp.com
```

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint
```

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Hader Renteria**

- GitHub: [@haderrenteria13](https://github.com/haderrenteria13)

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Iconos

---

<p align="center">
  Hecho con ❤️ por Hader Renteria para Ronald Barber 💈
</p>
