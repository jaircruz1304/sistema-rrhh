"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx'; 
import Papa from 'papaparse';

export default function ImportadorAsistencia() {
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' | 'info' | null }>({ texto: '', tipo: null });
  const [fileInfo, setFileInfo] = useState<{ nombre: string; tamaño: string } | null>(null);

  const enviarAlServidor = async (tipo: string, datos: any[]) => {
    try {
      setLoading(true);
      setProgreso(5); // Iniciamos progreso visual
      
      // Dividimos los datos en bloques para reportar progreso (Batching en cliente)
      const batchSize = 100; // Procesamos de 100 en 100 para la barra de progreso
      const totalBatches = Math.ceil(datos.length / batchSize);
      let totalProcesados = 0;

      for (let i = 0; i < datos.length; i += batchSize) {
        const batch = datos.slice(i, i + batchSize);
        
        const res = await fetch('/api/asistencia/importar', { 
          method: 'POST',
          body: JSON.stringify({ tipo, datos: batch }),
          headers: { 'Content-Type': 'application/json' }
        });

        const resultado = await res.json();
        if (!res.ok) throw new Error(resultado.error || "Error en la carga");

        totalProcesados += resultado.registros;
        // Calculamos el porcentaje
        const porcentaje = Math.round(((i + batchSize) / datos.length) * 100);
        setProgreso(porcentaje > 100 ? 100 : porcentaje);
      }
      
      setMensaje({ 
        texto: `Sincronización Exitosa: ${totalProcesados} registros procesados correctamente.`, 
        tipo: 'exito' 
      });
      setFileInfo(null);
    } catch (error: any) {
      setMensaje({ texto: `Fallo: ${error.message}`, tipo: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setProgreso(0), 2000); // Reset barra después de 2s
    }
  };

  const procesarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileInfo({ nombre: file.name, tamaño: (file.size / 1024).toFixed(2) + " KB" });
    setMensaje({ texto: '', tipo: null });

    const reader = new FileReader();
    reader.onload = (evt: any) => {
      try {
        const dataBuffer = evt.target?.result;
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) {
          setMensaje({ texto: "El archivo está vacío.", tipo: 'error' });
          return;
        }

        const esTeams = (jsonData[0] as any)['Nombre del empleado'];
        enviarAlServidor(esTeams ? 'TEAMS' : 'BIOMETRICO', jsonData);
      } catch (err) {
        setMensaje({ texto: "Error al leer Excel.", tipo: 'error' });
      }
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => enviarAlServidor('BIOMETRICO', results.data)
      });
    } else {
      reader.readAsArrayBuffer(file);
    }
    e.target.value = ''; 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        
        {/* Header con contraste mejorado */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/10 border border-emerald-500/20">
             <span className="text-2xl">📤</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tighter uppercase leading-none">
              Módulo de <span className="text-emerald-600">Importación</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Gestión de Marcaciones Masivas</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12">
            
            {/* Zona de Carga */}
            <div className={`relative group transition-all duration-500 ${loading ? 'scale-[0.98] opacity-70' : 'hover:scale-[1.01]'}`}>
              <div className="absolute inset-0 bg-emerald-50/50 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <label className="relative border-4 border-dashed border-slate-100 group-hover:border-emerald-500/30 rounded-[2rem] p-16 flex flex-col items-center justify-center transition-all cursor-pointer bg-slate-50/30">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl group-hover:rotate-6 transition-transform duration-300">
                  <span className="text-4xl">{loading ? '⚙️' : '📁'}</span>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-black text-[#0f172a] uppercase tracking-tight">
                    {fileInfo ? fileInfo.nombre : "Arrastre su reporte aquí"}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                    {fileInfo ? `Tamaño detectado: ${fileInfo.tamaño}` : "Excel (.xlsx) o Biométrico (.csv)"}
                  </p>
                </div>

                <input type="file" accept=".csv, .xlsx, .xls" onChange={procesarArchivo} disabled={loading} className="hidden" />
              </label>
            </div>

            {/* BARRA DE PROGRESO DINÁMICA */}
            {loading && (
              <div className="mt-12 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Sincronizando con Servidor</span>
                  <span className="text-lg font-black text-emerald-600">{progreso}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>
            )}

            {/* MENSAJES DE ESTADO */}
            {mensaje.tipo && !loading && (
              <div className={`mt-8 p-6 rounded-[1.5rem] border-2 animate-in zoom-in-95 duration-300 ${
                mensaje.tipo === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
                'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${
                    mensaje.tipo === 'error' ? 'bg-rose-200' : 'bg-emerald-200'
                  }`}>
                    {mensaje.tipo === 'error' ? '✕' : '✓'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-60">Notificación del Sistema</p>
                    <p className="text-sm font-bold">{mensaje.texto}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Informativo */}
          <div className="bg-[#0f172a] px-10 py-6 flex justify-between items-center">
            <div className="flex gap-4">
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Protección de Duplicados Activa
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-bold">FIAS CORE SYSTEM v2.5</p>
          </div>
        </div>
      </div>
    </div>
  );
}