"use client";
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiMapPin, FiClock, FiUserCheck, 
  FiAlertTriangle, FiTrendingUp, FiBriefcase, 
  FiChevronRight, FiBox, FiActivity, FiTarget 
} from 'react-icons/fi';

// Configuración de colores por unidad para reemplazar las imágenes
const COLOR_MAP: Record<string, { bg: string, text: string, border: string }> = {
  "REM": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  "FAP": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  "BIO": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  "PASF": { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
  "CONSERVA": { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  "FEIG": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  "DEFAULT": { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100" }
};

const getProjectStyle = (codigo: string = "") => {
  const code = codigo.toUpperCase();
  if (code.includes("REM")) return COLOR_MAP["REM"];
  if (code.includes("FAP")) return COLOR_MAP["FAP"];
  if (code.includes("BIO")) return COLOR_MAP["BIO"];
  if (code.includes("PASF")) return COLOR_MAP["PASF"];
  if (code.includes("CONSERVA")) return COLOR_MAP["CONSERVA"];
  if (code.includes("FEIG")) return COLOR_MAP["FEIG"];
  return COLOR_MAP["DEFAULT"];
};

export default function DashboardTTHH() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-full animate-bounce" />
        <p className="font-black text-xs uppercase tracking-widest text-slate-400">Preparando Dashboard...</p>
      </div>
    </div>
  );

  const totalGente = data?.contratos?.reduce((acc: any, curr: any) => acc + curr._count._all, 0) || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-slate-900 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
              TTHH <span className="text-emerald-500">Panel</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Fondo de Inversión Ambiental</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3">
               <FiActivity className="text-emerald-400" />
               <span className="text-[11px] font-black uppercase tracking-tighter">Estado: Operativo</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<FiUsers />} label="Total Personal" value={totalGente} color="blue" />
          <StatCard icon={<FiClock />} label="Permisos" value={data?.alertas?.permisos} color="amber" />
          <StatCard icon={<FiAlertTriangle />} label="Vacaciones" value={data?.alertas?.vacaciones} color="rose" />
          <StatCard icon={<FiTarget />} label="Meta Anual" value="92%" color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LADO IZQUIERDO: ESTADÍSTICAS */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <FiBriefcase className="text-emerald-500" /> Modalidad Laboral
              </h4>
              <div className="space-y-4">
                {data?.contratos?.map((c: any) => (
                  <div key={c.tipo_contrato} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-600 uppercase">{c.tipo_contrato}</span>
                    <span className="text-sm font-black text-slate-900">{c._count._all}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <FiMapPin className="text-rose-500" /> Sedes
              </h4>
              <div className="space-y-6">
                {data?.geografia?.map((g: any) => (
                  <div key={g.nombre_ciudad}>
                    <div className="flex justify-between text-[10px] font-black mb-2 uppercase">
                      <span className="text-slate-500">{g.nombre_ciudad}</span>
                      <span className="text-slate-900">{g._count.funcionarios}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${(g._count.funcionarios / totalGente) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LADO DERECHO: TARJETAS DE PROYECTOS SIN IMÁGENES */}
          <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-fit">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                <FiUserCheck className="text-emerald-600 text-lg" /> Distribución por Proyectos
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {data?.proyectos?.map((p: any) => {
                const style = getProjectStyle(p.codigo_proyecto || p.nombre_proyecto);
                return (
                  <div key={p.nombre_proyecto} className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden">
                    {/* Decoración lateral de color */}
                    <div className={`absolute top-0 left-0 w-2 h-full ${style.bg.replace('50', '500')}`} />
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                       
                        <h5 className="text-[13px] font-black text-slate-800 uppercase leading-tight line-clamp-2 pr-4">
                          {p.nombre_proyecto}
                        </h5>
                        <div className="flex items-center gap-2 pt-2">
                           <div className="flex -space-x-2">
                              {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />)}
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 uppercase">
                             {p._count.funcionarios} Especialistas
                           </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <FiBox size={20} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
    emerald: "text-emerald-600 bg-emerald-50"
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:translate-y-[-4px] transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-xl ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value || 0}</h3>
    </div>
  );
}