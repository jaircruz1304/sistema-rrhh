"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function ReporteAsistencia() {
  const [marcaciones, setMarcaciones] = useState([]);

  useEffect(() => {
    fetch('/api/asistencia/listar').then(res => res.json()).then(setMarcaciones);
  }, []);

  const exportarFormatoMacro = () => {
    // Ordenar por Fecha y ID (Menor a Mayor)
    const dataOrdenada = [...marcaciones].sort((a, b) => {
      const fA = new Date(a.fecha_hora).getTime();
      const fB = new Date(b.fecha_hora).getTime();
      if (fA !== fB) return fA - fB;
      return parseInt(a.funcionarios?.codigo_biometrico) - parseInt(b.funcionarios?.codigo_biometrico);
    });

    const rows = dataOrdenada.map(m => ({
      "FECHA_MARCACION": new Date(m.fecha_hora).toLocaleDateString('es-EC'),
      "HORA_MARCACION": new Date(m.fecha_hora).toLocaleTimeString('es-EC', { hour12: false }),
      "CODIGO_BIOMETRICO": m.funcionarios?.codigo_biometrico
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data"); // Nombre "Data" para que tu Excel lo reconozca
    XLSX.writeFile(wb, "Data_Para_Biometrico.xlsx");
  };

  return (
    <div className="p-12 bg-white min-h-screen flex flex-col items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-2xl font-bold text-gray-800">Generador de Data para Macro</h1>
        <p className="text-gray-500 my-4">
          Este módulo genera el archivo limpio con 3 columnas listo para ser procesado por tu sistema de Excel.
        </p>
        <button 
          onClick={exportarFormatoMacro}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all w-full"
        >
          DESCARGAR DATA ORDENADA
        </button>
      </div>
    </div>
  );
}