"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  FiEdit3, FiTrash2, FiSave, FiSearch, FiCalendar, 
  FiClock, FiBriefcase, FiDollarSign, FiChevronRight, FiAlertTriangle 
} from 'react-icons/fi';

const LOGO_MAP: Record<string, string> = {
  "FIAS": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/FIAS.png",
  "REM": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/REM.png",
  "FAP": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/FAP.jpg",
  "BIO": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/Bioeconom%C3%ADa.png",
  "PASF": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/PASF.png",
  "CONSERVA": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/Conserva%20Aves.png",
  "FEIG": "https://raw.githubusercontent.com/jaircruz1304/FIAS/Img_Map/FEIG.png"
};

export default function PaginaProyectos() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [status, setStatus] = useState({ msg: '', error: false });

  const [form, setForm] = useState({
    codigo_proyecto: '',
    nombre_proyecto: '',
    presupuesto: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'ACTIVO',
    descripcion: ''
  });

  const fetchProyectos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proyectos');
      const data = await res.json();
      setProyectos(Array.isArray(data) ? data : []);
    } catch (e) { 
      console.error("Error cargando proyectos:", e);
      setProyectos([]); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchProyectos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ msg: 'Guardando...', error: false });
    const payload = {
      proyecto_id: editandoId, 
      ...form,
      presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : null
    };

    try {
      const res = await fetch('/api/proyectos', {
        method: editandoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditandoId(null);
        setForm({ codigo_proyecto: '', nombre_proyecto: '', presupuesto: '', fecha_inicio: '', fecha_fin: '', estado: 'ACTIVO', descripcion: '' });
        await fetchProyectos();
        setStatus({ msg: '✅ ¡Actualizado!', error: false });
        setTimeout(() => setStatus({ msg: '', error: false }), 2000);
      } else {
        const err = await res.json();
        setStatus({ msg: `❌ ${err.error || 'Error'}`, error: true });
      }
    } catch (err) {
      setStatus({ msg: '❌ Error de conexión', error: true });
    }
  };

  const filtrados = useMemo(() => 
    proyectos.filter(p => 
      p.nombre_proyecto?.toLowerCase().includes(busqueda.toLowerCase()) || 
      p.codigo_proyecto?.toLowerCase().includes(busqueda.toLowerCase())
    ), [proyectos, busqueda]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 lg:p-12 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* FORMULARIO */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className={`py-4 px-10 text-white font-black text-xs uppercase flex justify-between items-center ${editandoId ? 'bg-indigo-600' : 'bg-slate-900'}`}>
            <span className="flex items-center gap-3"><FiBriefcase size={18}/> {editandoId ? 'Modificar Proyecto' : 'Nueva Unidad'}</span>
            {status.msg && <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px]">{status.msg}</span>}
          </div>
          <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <input placeholder="CÓDIGO" className="p-4 bg-slate-50 border-2 rounded-2xl font-bold uppercase focus:border-indigo-600 outline-none transition-all" 
              value={form.codigo_proyecto} onChange={e => setForm({...form, codigo_proyecto: e.target.value})} required />
            <input placeholder="NOMBRE" className="md:col-span-2 p-4 bg-slate-50 border-2 rounded-2xl font-bold uppercase focus:border-indigo-600 outline-none transition-all" 
              value={form.nombre_proyecto} onChange={e => setForm({...form, nombre_proyecto: e.target.value})} required />
            <select className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none cursor-pointer" 
              value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="PAUSADO">PAUSADO</option>
              <option value="FINALIZADO">FINALIZADO</option>
            </select>
            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
               <input type="date" className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all" 
                value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
               <input type="date" className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all" 
                value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} />
               <button className="bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg">
                {editandoId ? 'Guardar Cambios' : 'Registrar Proyecto'}
               </button>
            </div>
          </form>
        </section>

        {/* BUSCADOR */}
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="BUSCAR PROYECTO..." className="w-full pl-12 pr-6 py-4 bg-white border-2 rounded-2xl font-black text-xs uppercase outline-none focus:border-slate-900 shadow-sm transition-all"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* CONTENEDOR DE TARJETAS */}
        {loading ? (
          <div className="text-center py-20 font-black text-slate-300 animate-pulse text-2xl tracking-[0.3em]">CARGANDO DATOS...</div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
            <FiAlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No se encontraron proyectos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-10">
            {filtrados.map((p) => {
              const logoKey = Object.keys(LOGO_MAP).find(k => p.codigo_proyecto?.toUpperCase().includes(k));
              return (
                <div key={p.proyecto_id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                  
                  {/* CONTENEDOR DE IMAGEN ESCALABLE */}
                  <div className="aspect-video bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden border-b border-slate-100 group-hover:bg-white transition-colors">
                    <img 
                      src={LOGO_MAP[logoKey || "FIAS"]} 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" 
                      alt="Logo Proyecto" 
                    />
                    <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter shadow-lg">
                      {p.estado}
                    </div>
                  </div>

                  <div className="p-6 lg:p-8 space-y-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{p.codigo_proyecto}</span>
                      <h3 className="font-black text-slate-900 uppercase text-[13px] mt-1 leading-tight line-clamp-2 min-h-[2rem]">
                        {p.nombre_proyecto}
                      </h3>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px] font-bold">
                      <div className="text-center flex-1">
                        <p className="text-slate-400 text-[8px] uppercase mb-1">Inicio</p>
                        <p className="text-slate-900 italic font-black">{p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString() : 'N/D'}</p>
                      </div>
                      <div className="px-2">
                         <FiChevronRight className="text-slate-300" size={16} />
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-slate-400 text-[8px] uppercase mb-1">Cierre</p>
                        <p className="text-slate-900 italic font-black">{p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : 'VIGENTE'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setEditandoId(p.proyecto_id);
                        setForm({
                          codigo_proyecto: p.codigo_proyecto || '',
                          nombre_proyecto: p.nombre_proyecto || '',
                          presupuesto: p.presupuesto?.toString() || '',
                          fecha_inicio: p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '',
                          fecha_fin: p.fecha_fin ? p.fecha_fin.split('T')[0] : '',
                          estado: p.estado || 'ACTIVO',
                          descripcion: p.descripcion || ''
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-md active:translate-y-1"
                    >
                      <FiEdit3 className="inline mr-2" size={14}/> Editar Proyecto
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}