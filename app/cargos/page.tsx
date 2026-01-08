'use client';
import { useEffect, useState, useMemo } from 'react';
import { FiBriefcase, FiSearch, FiEdit3, FiTrash2, FiCheckCircle, FiAlertCircle, FiTag } from 'react-icons/fi';

export default function PaginaCargos() {
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState({ codigo_cargo: '', nombre_cargo: '', descripcion: '' });
  
  // Estado para mensajes y validaciones
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error' | '', texto: string}>({tipo: '', texto: ''});
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => { fetchCargos(); }, []);

  const fetchCargos = async () => {
    try {
      const res = await fetch('/api/cargos');
      const data = await res.json();
      setCargos(Array.isArray(data) ? data : []);
    } catch (e) { setCargos([]); }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!form.codigo_cargo.trim() || !form.nombre_cargo.trim()) {
      setErrores(['codigo', 'nombre']);
      mostrarMensaje('error', 'Complete los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const metodo = editandoId ? 'PATCH' : 'POST';
      const cuerpo = editandoId ? { ...form, cargo_id: editandoId } : form;

      const res = await fetch('/api/cargos', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });

      if (res.ok) {
        mostrarMensaje('success', editandoId ? 'Cargo actualizado' : 'Cargo creado con éxito');
        setForm({ codigo_cargo: '', nombre_cargo: '', descripcion: '' });
        setEditandoId(null);
        setErrores([]);
        fetchCargos();
      } else {
        mostrarMensaje('error', 'Error al procesar la solicitud');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (c: any) => {
    setEditandoId(c.cargo_id);
    setForm({
      codigo_cargo: c.codigo_cargo,
      nombre_cargo: c.nombre_cargo,
      descripcion: c.descripcion || ''
    });
    setErrores([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cargosFiltrados = useMemo(() => 
    cargos.filter(c => 
        c.nombre_cargo?.toLowerCase().includes(busqueda.toLowerCase()) || 
        c.codigo_cargo?.toLowerCase().includes(busqueda.toLowerCase())
    ), [cargos, busqueda]
  );

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 font-sans bg-[#F9FBFF]">
      
      {/* NOTIFICACIÓN FLOTANTE */}
      {mensaje.texto && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-8 py-4 rounded-2xl shadow-2xl border-2 animate-in fade-in zoom-in duration-300 ${
          mensaje.tipo === 'success' ? 'bg-white border-emerald-500 text-emerald-700' : 'bg-white border-rose-500 text-rose-700'
        }`}>
          {mensaje.tipo === 'success' ? <FiCheckCircle size={24} /> : <FiAlertCircle size={24} />}
          <span className="font-black uppercase text-xs tracking-widest">{mensaje.texto}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Estructura de <span className="text-indigo-600">Cargos</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1 italic">Catálogo Institucional • {cargos.length} Posiciones</p>
        </div>
        <div className="w-full md:w-96 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
          <input 
            type="text" 
            placeholder="BUSCAR CARGO O CÓDIGO..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm uppercase focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULARIO DE CARGOS */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden sticky top-8">
            <div className={`p-5 text-center font-black uppercase tracking-[0.2em] text-xs text-white ${editandoId ? 'bg-amber-500' : 'bg-slate-900'}`}>
              {editandoId ? 'Editando Cargo' : 'Registrar Nuevo Rol'}
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-1 tracking-widest ${errores.includes('codigo') ? 'text-rose-500' : 'text-slate-500'}`}>Código Interno *</label>
                <div className="relative">
                    <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="EJ: CAR-001"
                        className={`w-full pl-11 p-4 bg-slate-50 border-2 rounded-2xl font-bold text-sm text-slate-900 outline-none uppercase transition-all ${errores.includes('codigo') ? 'border-rose-300 bg-rose-50' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'}`}
                        value={form.codigo_cargo}
                        onChange={e => setForm({...form, codigo_cargo: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-1 tracking-widest ${errores.includes('nombre') ? 'text-rose-500' : 'text-slate-500'}`}>Nombre de la Posición *</label>
                <input 
                    type="text" 
                    placeholder="EJ: ANALISTA DE SISTEMAS"
                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold text-sm text-slate-900 outline-none uppercase transition-all ${errores.includes('nombre') ? 'border-rose-300 bg-rose-50' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'}`}
                    value={form.nombre_cargo}
                    onChange={e => setForm({...form, nombre_cargo: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Descripción / Notas</label>
                <textarea 
                    rows={3}
                    placeholder="OPCIONAL..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 outline-none uppercase transition-all focus:border-indigo-500 focus:bg-white resize-none"
                    value={form.descripcion}
                    onChange={e => setForm({...form, descripcion: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full text-white font-black py-5 rounded-2xl text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 ${editandoId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-slate-900 shadow-indigo-100'}`}
                >
                  {loading ? "PROCESANDO..." : editandoId ? "GUARDAR CAMBIOS" : "CREAR CARGO"}
                </button>
                {editandoId && (
                  <button 
                    type="button" 
                    onClick={() => {setEditandoId(null); setForm({codigo_cargo:'', nombre_cargo:'', descripcion:''}); setErrores([]);}} 
                    className="w-full mt-4 text-slate-400 font-black py-2 text-[10px] uppercase hover:text-rose-500 transition-colors"
                  >
                    Cancelar Operación
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* LISTA DE CARGOS */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-4 px-2 mb-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Posiciones Registradas</h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[75vh] pr-4 custom-scrollbar">
            {cargosFiltrados.map((c: any) => (
              <div key={c.cargo_id} className="bg-white p-5 rounded-[1.8rem] border border-slate-200 flex items-center gap-6 hover:border-indigo-500 hover:shadow-lg transition-all group animate-in fade-in duration-300">
                <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black border-2 border-slate-800 group-hover:bg-indigo-600 transition-colors shrink-0 shadow-lg">
                  <FiBriefcase className="text-indigo-300 size-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black border border-slate-200 uppercase">
                      {c.codigo_cargo}
                    </span>
                    <span className="text-slate-300 text-[10px]">#{c.cargo_id}</span>
                  </div>
                  <h3 className="font-black text-slate-900 uppercase text-sm truncate tracking-tight">
                    {c.nombre_cargo}
                  </h3>
                  {c.descripcion && (
                    <p className="text-[10px] text-slate-400 font-bold truncate uppercase mt-1">{c.descripcion}</p>
                  )}
                </div>

                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => iniciarEdicion(c)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                    <FiEdit3 size={18} />
                  </button>
                  <button onClick={async () => {
                    if(confirm('¿ELIMINAR ESTE CARGO?')) {
                      await fetch(`/api/cargos?id=${c.cargo_id}`, { method: 'DELETE' });
                      fetchCargos();
                      mostrarMensaje('success', 'Cargo eliminado');
                    }
                  }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {cargosFiltrados.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-300 font-black uppercase tracking-[0.3em] text-xs">
                No existen registros para mostrar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}