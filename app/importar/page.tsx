"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function ImportadorAsistencia() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' | 'info' | null }>({ texto: '', tipo: null });
  const [fileInfo, setFileInfo] = useState<{ nombre: string; tamaño: string } | null>(null);

  const enviarAlServidor = async (tipo: string, datos: any[]) => {
    try {
      setLoading(true);
      setMensaje({ texto: `Sincronizando ${datos.length} registros con el servidor...`, tipo: 'info' });
      
      const res = await fetch('/api/asistencia/importar', { 
        method: 'POST',
        body: JSON.stringify({ tipo, datos }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const resultado = await res.json();
      
      if (!res.ok) throw new Error(resultado.error || "Error en la carga de datos");
      
      setMensaje({ 
        texto: `Sincronización Exitosa: Se han procesado ${resultado.registros} registros de ${tipo}.`, 
        tipo: 'exito' 
      });
      setFileInfo(null);
    } catch (error: any) {
      setMensaje({ texto: `Fallo en el servidor: ${error.message}`, tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const procesarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileInfo({ 
      nombre: file.name, 
      tamaño: (file.size / 1024).toFixed(2) + " KB" 
    });
    setLoading(true);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => enviarAlServidor('BIOMETRICO', results.data)
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt: any) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          
          if (data.length === 0) {
            setMensaje({ texto: "El archivo Excel no contiene datos válidos.", tipo: 'error' });
            setLoading(false);
            return;
          }

          const esTeams = (data[0] as any)['Nombre del empleado'];
          enviarAlServidor(esTeams ? 'TEAMS' : 'BIOMETRICO', data);
        } catch (err) {
          setMensaje({ texto: "Error estructural al leer el archivo Excel.", tipo: 'error' });
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    }
    e.target.value = ''; 
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado Profesional */}
        <div className="flex items-center gap-4 mb-8">
          
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              Importar <span className="text-emerald-100">Marcaciones</span>
            </h1>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-widest">Módulo de Importación Inteligente</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-800 mb-2">Carga de Marcaciones</h2>
              <p className="text-sm text-slate-500 font-medium">
                Soporta reportes de <strong className="text-slate-700">Microsoft Teams</strong> (.xlsx) y <strong className="text-slate-700">Biométricos ZKTeco</strong> (.csv).
              </p>
            </div>

            {/* Zona de Drop/Input */}
            <div className={`relative group transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="absolute inset-0 bg-emerald-50 rounded-3xl scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
              <div className="relative border-2 border-dashed border-slate-200 group-hover:border-emerald-400 rounded-3xl p-12 flex flex-col items-center justify-center transition-colors">
                <div className="w-16 h-16 bg-slate-50 group-hover:bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-colors">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📥</span>
                </div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-tight mb-1">
                  {fileInfo ? fileInfo.nombre : "Seleccionar archivo"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {fileInfo ? `Tamaño: ${fileInfo.tamaño}` : "Arrastra o haz click para buscar"}
                </p>
                
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={procesarArchivo}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Estados y Mensajes */}
            <div className="mt-8 space-y-4">
              {loading && (
                <div className="flex items-center justify-center gap-3 py-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200 animate-in fade-in zoom-in duration-300">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Procesando Datos en Tiempo Real</span>
                </div>
              )}

              {mensaje.tipo && (
                <div className={`p-6 rounded-2xl border-2 animate-in slide-in-from-top-4 duration-500 ${
                  mensaje.tipo === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                  mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                  'bg-blue-50 border-blue-100 text-blue-700'
                }`}>
                  <div className="flex items-start gap-4">
                    <span className="text-xl">
                      {mensaje.tipo === 'error' ? '🚫' : mensaje.tipo === 'exito' ? '✅' : 'ℹ️'}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase mb-1 tracking-wider">Resultado del Sistema</p>
                      <p className="text-xs font-bold leading-relaxed">{mensaje.texto}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer de Ayuda */}
          <div className="bg-slate-50 border-t border-slate-100 px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-nowrap">Detección Automática</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-nowrap">Limpieza de Duplicados</span>
              </div>
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase italic text-nowrap">Terminal Ver. 2.0.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}