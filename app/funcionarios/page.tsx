"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  FiBriefcase, FiMapPin, FiEdit3, FiTrash2, FiSearch, 
  FiPlus, FiUser, FiMail, FiAlertCircle, FiCheckCircle, FiGlobe 
} from 'react-icons/fi';

const INITIAL_STATE = {
  nombres: '', apellidos: '', numero_identificacion: '', correo: '',
  codigo_biometrico: '', codigo_teams: '', genero: 'M', estado_civil: 'SOLTERO',
  telefono: '', celular: '', direccion: '', ciudad_id: '', cargo_id: '', proyecto_id: ''
};

export default function PaginaGestionPersonal() {
  const [data, setData] = useState({ 
    funcionarios: [], 
    catalogos: { cargos: [], proyectos: [], ciudades: [] } 
  });
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(INITIAL_STATE);
  const [busqueda, setBusqueda] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error' | '', texto: string}>({tipo: '', texto: ''});
  const [errores, setErrores] = useState<string[]>([]);

  const cargar = async () => {
    try {
      const res = await fetch('/api/funcionarios');
      const resData = await res.json();
      setData({
        funcionarios: Array.isArray(resData.funcionarios) ? resData.funcionarios : [],
        catalogos: {
          cargos: resData.catalogos?.cargos || [],
          proyectos: resData.catalogos?.proyectos || [],
          ciudades: resData.catalogos?.ciudades || []
        }
      });
    } catch (error) { mostrarMensaje('error', 'Error de conexión'); }
  };

  useEffect(() => { cargar(); }, []);

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const validarFormulario = () => {
    const nuevosErrores = [];
    if (!form.nombres.trim()) nuevosErrores.push('nombres');
    if (!form.apellidos.trim()) nuevosErrores.push('apellidos');
    if (!form.numero_identificacion.trim()) nuevosErrores.push('identificacion');
    if (!form.codigo_biometrico.trim()) nuevosErrores.push('biometrico');
    setErrores(nuevosErrores);
    return nuevosErrores.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) {
      mostrarMensaje('error', 'Campos obligatorios faltantes');
      return;
    }
    setLoading(true);
    try {
      const metodo = editandoId ? 'PATCH' : 'POST';
      const res = await fetch('/api/funcionarios', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editandoId ? { ...form, funcionario_id: editandoId } : form)
      });
      if (res.ok) {
        mostrarMensaje('success', 'Operación exitosa');
        setForm(INITIAL_STATE);
        setEditandoId(null);
        setErrores([]);
        cargar();
      } else {
        const err = await res.json();
        mostrarMensaje('error', err.error || 'Error al guardar');
      }
    } catch (e) { mostrarMensaje('error', 'Error en el servidor'); } finally { setLoading(false); }
  };

  const iniciarEdicion = (f: any) => {
    setEditandoId(f.funcionario_id);
    setForm({ ...f, cargo_id: f.cargo_id?.toString(), proyecto_id: f.proyecto_id?.toString(), ciudad_id: f.ciudad_id?.toString() });
    setErrores([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtrados = useMemo(() => 
    data.funcionarios.filter((f: any) => 
      `${f.nombres} ${f.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.numero_identificacion.includes(busqueda)
    ), [data.funcionarios, busqueda]
  );

  return (
    <div className="max-w-[1500px] mx-auto p-6 space-y-8 font-sans bg-[#F9FBFF]">
      
      {mensaje.texto && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-8 py-4 rounded-2xl shadow-2xl border-2 animate-in fade-in zoom-in duration-300 ${
          mensaje.tipo === 'success' ? 'bg-white border-emerald-500 text-emerald-700' : 'bg-white border-rose-500 text-rose-700'
        }`}>
          {mensaje.tipo === 'success' ? <FiCheckCircle size={24} /> : <FiAlertCircle size={24} />}
          <span className="font-black uppercase text-xs tracking-widest">{mensaje.texto}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestión <span className="text-indigo-600">Personal</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">FIAS • {data.funcionarios.length} Registros</p>
        </div>
        <div className="w-full md:w-96 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
          <input type="text" placeholder="BUSCAR POR NOMBRE O CÉDULA..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm uppercase focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner" value={busqueda} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden sticky top-8">
            <div className={`p-5 text-center font-black uppercase tracking-[0.2em] text-xs text-white ${editandoId ? 'bg-amber-500' : 'bg-slate-900'}`}>
              {editandoId ? 'Modo Edición' : 'Nuevo Funcionario'}
            </div>

            <div className="flex bg-slate-50 p-2 gap-2 border-b border-slate-100">
              {['personal', 'laboral', 'contacto'].map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="p-8 space-y-6">
              {activeTab === 'personal' && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nombres *" value={form.nombres} error={errores.includes('nombres')} onChange={(v: string) => setForm({...form, nombres: v})} />
                    <Field label="Apellidos *" value={form.apellidos} error={errores.includes('apellidos')} onChange={(v: string) => setForm({...form, apellidos: v})} />
                  </div>
                  <Field label="Identificación (C.I/RUC) *" value={form.numero_identificacion} error={errores.includes('identificacion')} onChange={(v: string) => setForm({...form, numero_identificacion: v})} />
                </div>
              )}

              {activeTab === 'laboral' && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border-2 border-indigo-100 grid grid-cols-2 gap-4 shadow-inner">
                    <Field label="Cód. Biométrico *" value={form.codigo_biometrico} error={errores.includes('biometrico')} onChange={(v: string) => setForm({...form, codigo_biometrico: v})} />
                    <Field label="Usuario Teams" value={form.codigo_teams} onChange={(v: string) => setForm({...form, codigo_teams: v})} />
                  </div>
                  <Select label="Cargo Institucional" value={form.cargo_id} onChange={(v: string) => setForm({...form, cargo_id: v})} options={data.catalogos.cargos.map((c:any)=>({id:c.cargo_id, n:c.nombre_cargo}))} />
                  <Select label="Proyecto Asignado" value={form.proyecto_id} onChange={(v: string) => setForm({...form, proyecto_id: v})} options={data.catalogos.proyectos.map((p:any)=>({id:p.proyecto_id, n:p.nombre_proyecto}))} />
                </div>
              )}

              {activeTab === 'contacto' && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                  <Field label="Correo Electrónico" value={form.correo} onChange={(v: string) => setForm({...form, correo: v})} type="email" />
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Sede / Ciudad" value={form.ciudad_id} onChange={(v: string) => setForm({...form, ciudad_id: v})} options={data.catalogos.ciudades.map((c:any)=>({id:c.ciudad_id, n:c.nombre_ciudad}))} />
                    <Field label="Teléfono Celular" value={form.celular} onChange={(v: string) => setForm({...form, celular: v})} />
                  </div>
                  <Field label="Dirección de Domicilio" value={form.direccion} onChange={(v: string) => setForm({...form, direccion: v})} />
                </div>
              )}

              <div className="pt-6">
                <button type="submit" disabled={loading} className={`w-full text-white font-black py-5 rounded-2xl text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 ${editandoId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-slate-900 shadow-indigo-100'}`}>
                  {loading ? "PROCESANDO..." : editandoId ? "ACTUALIZAR DATOS" : "REGISTRAR FUNCIONARIO"}
                </button>
                {editandoId && (
                  <button type="button" onClick={() => {setEditandoId(null); setForm(INITIAL_STATE); setErrores([]);}} className="w-full mt-4 text-slate-400 font-black py-2 text-[10px] uppercase hover:text-rose-500 transition-colors">Cancelar Edición</button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-4 px-2 mb-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Registros Actuales</h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[80vh] pr-4 custom-scrollbar">
            {filtrados.map((f: any) => (
              <div key={f.funcionario_id} className="bg-white p-5 rounded-[1.8rem] border border-slate-200 flex items-center gap-6 hover:border-indigo-500 hover:shadow-lg transition-all group">
                <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black border-2 border-slate-800 group-hover:bg-indigo-600 transition-colors shrink-0 shadow-lg">
                  <span className="text-[9px] text-indigo-300 leading-none mb-1 uppercase">ID</span>
                  <span className="text-xl">{f.codigo_biometrico}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 uppercase text-sm truncate tracking-tight mb-1">
                    {f.nombres} {f.apellidos}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-tight">
                      <FiBriefcase className="size-3" /> {f.cargos?.nombre_cargo || 'SIN CARGO'}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                      <FiMapPin className="size-3" /> {f.ciudades?.nombre_ciudad}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                      🆔 {f.numero_identificacion}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => iniciarEdicion(f)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                    <FiEdit3 size={18} />
                  </button>
                  <button onClick={async () => {
                    if(confirm('¿ELIMINAR ESTE FUNCIONARIO?')) {
                      await fetch(`/api/funcionarios?id=${f.funcionario_id}`, { method: 'DELETE' });
                      cargar();
                      mostrarMensaje('success', 'Eliminado correctamente');
                    }
                  }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES CORREGIDOS PARA TS
const Field = ({ label, value, onChange, error, type = "text" }: { label: string, value: string, onChange: (v: string) => void, error?: boolean, type?: string }) => (
  <div className="space-y-2">
    <label className={`text-[10px] font-black uppercase ml-1 tracking-widest ${error ? 'text-rose-500' : 'text-slate-500'}`}>{label}</label>
    <input 
      type={type} 
      className={`w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold text-sm text-slate-900 outline-none uppercase transition-all ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-100 focus:border-indigo-500 focus:bg-white focus:shadow-md'}`} 
      value={value} 
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
    />
  </div>
);

const Select = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {id: any, n: string}[] }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
    <div className="relative">
      <select 
        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm text-slate-950 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer uppercase appearance-none" 
        value={value} 
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        {options.map((o: any) => <option key={o.id} value={o.id}>{o.n.toUpperCase()}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <FiGlobe size={16} />
      </div>
    </div>
  </div>
);