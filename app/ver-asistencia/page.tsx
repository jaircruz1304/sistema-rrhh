"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function ReporteAsistencia() {
  const [marcaciones, setMarcaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });

  const cargarData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/asistencia/listar?mes=${filtros.mes}&anio=${filtros.anio}`);
      const data = await res.json();
      setMarcaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando marcaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarData(); }, [filtros]);

  const exportarFormatoMacro = () => {
    const rows = marcaciones.map(m => ({
      "FECHA_MARCACION": new Date(m.fecha_hora).toLocaleDateString('es-EC'),
      "HORA_MARCACION": new Date(m.fecha_hora).toLocaleTimeString('es-EC', { hour12: false }),
      "CODIGO_BIOMETRICO": m.funcionarios?.codigo_biometrico
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `Asistencia_${filtros.mes}_${filtros.anio}.xlsx`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* CABECERA */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">Control de Asistencia</h1>
          <p className="text-slate-600 font-bold italic">Generador de archivos para macro biometría.</p>
        </div>
        <div className="bg-white px-6 py-2 rounded-2xl border-2 border-slate-200 shadow-sm font-black text-indigo-600">
          {marcaciones.length} REGISTROS ENCONTRADOS
        </div>
      </div>

      {/* PANEL DE FILTROS - ALTO CONTRASTE */}
      <div className="bg-slate-950 p-8 rounded-3xl shadow-2xl border-2 border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Periodo Mensual</label>
          <select 
            className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl font-black text-white outline-none cursor-pointer focus:border-indigo-500"
            value={filtros.mes}
            onChange={(e) => setFiltros({...filtros, mes: parseInt(e.target.value)})}
          >
            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
              <option key={i} value={i + 1}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Año Fiscal</label>
          <select 
            className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl font-black text-white outline-none cursor-pointer focus:border-indigo-500"
            value={filtros.anio}
            onChange={(e) => setFiltros({...filtros, anio: parseInt(e.target.value)})}
          >
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <button 
          onClick={exportarFormatoMacro}
          disabled={marcaciones.length === 0}
          className="bg-indigo-600 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
        >
          Descargar .XLSX
        </button>
      </div>

      {/* VISTA PREVIA LIMITADA */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
        <div className="p-6 border-b-2 border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-black text-slate-900 uppercase text-xs">Muestra de datos (Primeras 50 marcaciones)</h3>
          <span className="text-[10px] font-bold text-slate-400">Total en memoria: {marcaciones.length}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b-2 border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-4">Fecha</th>
                <th className="px-8 py-4">Hora</th>
                <th className="px-8 py-4">Bio ID</th>
                <th className="px-8 py-4">Funcionario</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 animate-pulse">PROCESANDO BASE DE DATOS...</td></tr>
              ) : marcaciones.slice(0, 50).map((m, i) => (
                <tr key={i} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-950">{new Date(m.fecha_hora).toLocaleDateString('es-EC')}</td>
                  <td className="px-8 py-4 font-black text-indigo-600">{new Date(m.fecha_hora).toLocaleTimeString('es-EC', { hour12: false })}</td>
                  <td className="px-8 py-4 font-mono font-black bg-slate-50 text-center w-24 border-x border-slate-100">{m.funcionarios?.codigo_biometrico}</td>
                  <td className="px-8 py-4 font-bold text-slate-700 uppercase text-xs">{m.funcionarios?.nombres} {m.funcionarios?.apellidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {marcaciones.length > 50 && (
            <div className="p-6 bg-slate-50 text-center">
              <p className="text-xs font-black text-slate-400 uppercase">... {marcaciones.length - 50} registros adicionales ocultos para mejorar rendimiento ...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}