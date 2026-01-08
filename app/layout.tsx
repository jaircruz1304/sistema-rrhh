"use client";
import { useState } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <html lang="es">
      <body className={`${geistSans.variable} antialiased bg-[#f1f5f9] text-slate-900`}>
        <div className="flex min-h-screen">
          
          {/* SIDEBAR - ESQUEMA DE COLOR: CARBON & EMERALD */}
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 ease-in-out border-r border-emerald-500/10
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          `}>
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-[#0f172a] font-black text-xl">F</span>
                </div>
                <h1 className="text-white font-black text-2xl tracking-tighter">
                  FIAS<span className="text-emerald-500">RRHH</span>
                </h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white text-2xl">✕</button>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Core Operativo</p>
              <NavItem href="/dashboard" label="Dashboard" icon="📊" active={pathname === "/dashboard"} />
              <NavItem href="/funcionarios" label="Funcionarios" icon="👥" active={pathname === "/funcionarios"} />
              
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-8 mb-4">Control Asistencia</p>
              <NavItem href="/reportes" label="Exportar Reportes" icon="📑" active={pathname === "/asistencia"} />
              <NavItem href="/importar" label="Importar Biométrico" icon="📥" active={pathname === "/importar"} />
              <NavItem href="/ver-asistencia" label="Visor General" icon="👁️" active={pathname === "/ver-asistencia"} />
              
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-8 mb-4">Estructura</p>
              <NavItem href="/cargos" label="Cargos" icon="💼" active={pathname === "/cargos"} />
              <NavItem href="/proyectos" label="Proyectos" icon="📁" active={pathname === "/proyectos"} />
            </nav>

            <div className="p-6 bg-[#0a101f]">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-[#0f172a] font-bold text-xs">AD</div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate">Administrador</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">En línea</p>
                </div>
              </div>
            </div>
          </aside>

          {/* CAPA OSCURA PARA MÓVIL AL ABRIR MENÚ */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}

          {/* CONTENIDO PRINCIPAL */}
          <div className="flex-1 md:ml-72 flex flex-col min-w-0">
            <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 md:px-10 flex items-center justify-between">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-lg">
                <span className="text-2xl">☰</span>
              </button>
              
              <div className="hidden md:block">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
                  Sistema Integrado de RRHH
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-950 uppercase tracking-tighter">Terminal 01</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Quito, Ecuador</p>
                </div>
              </div>
            </header>

            <main className="p-4 md:p-10 w-full max-w-[1400px] mx-auto transition-all duration-500">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`
        flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 font-black text-sm group
        ${active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" 
          : "hover:bg-slate-800 text-slate-400 hover:text-white"
        }
      `}
    >
      <span className={`text-xl transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>
      {active && <span className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></span>}
    </Link>
  );
}