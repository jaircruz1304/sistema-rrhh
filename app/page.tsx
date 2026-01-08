import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      {/* SECCIÓN DE BIENVENIDA */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-8 md:p-12 shadow-2xl shadow-slate-200">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xs mb-4">
            Panel de Gestión Centralizada
          </h2>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">
            Bienvenido al Sistema <span className="text-emerald-500">FIAS RRHH</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Gestione el talento humano, controle la asistencia biométrica y genere 
            reportes estratégicos para la toma de decisiones institucionales.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/funcionarios" 
              className="bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>Gestionar Personal</span>
              <span className="text-xl">→</span>
            </Link>
            <Link 
              href="/importar" 
              className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-4 rounded-2xl transition-all flex items-center gap-2"
            >
              <span>Subir Biométrico</span>
              <span className="text-xl text-emerald-500">📥</span>
            </Link>
          </div>
        </div>

        {/* DECORACIÓN DE FONDO */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl"></div>
      </section>

      {/* TARJETAS DE ACCESO RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard 
          icon="📊" 
          title="Dashboard" 
          description="Visualice estadísticas generales de asistencia y cumplimiento."
          href="/dashboard"
        />
        <QuickActionCard 
          icon="📑" 
          title="Reportes" 
          description="Exporte documentos detallados en formatos compatibles."
          href="/reportes"
        />
        <QuickActionCard 
          icon="📁" 
          title="Proyectos" 
          description="Administre la asignación de personal por áreas y proyectos."
          href="/proyectos"
        />
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-black text-slate-950 mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </Link>
  );
}