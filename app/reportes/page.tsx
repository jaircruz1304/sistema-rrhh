'use client';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FiDownload, FiPlay, FiSearch, FiUser, FiCalendar, FiClock } from 'react-icons/fi';

export default function PaginaReporteCompleta() {
  const [reporte, setReporte] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [filtros, setFiltros] = useState({ 
    anio: '2026', 
    mes: '01', 
    funcionarioId: 'todos' 
  });

  const meses = [
    { v: '01', n: 'Enero' }, { v: '02', n: 'Febrero' }, { v: '03', n: 'Marzo' },
    { v: '04', n: 'Abril' }, { v: '05', n: 'Mayo' }, { v: '06', n: 'Junio' },
    { v: '07', n: 'Julio' }, { v: '08', n: 'Agosto' }, { v: '09', n: 'Septiembre' },
    { v: '10', n: 'Octubre' }, { v: '11', n: 'Noviembre' }, { v: '12', n: 'Diciembre' }
  ];

  const anios = ['2025', '2026', '2027'];

  useEffect(() => {
    fetch('/api/funcionarios')
      .then(res => res.json())
      .then(data => setFuncionarios(data.funcionarios || []));
  }, []);

  const generarData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes?${new URLSearchParams(filtros)}`);
      const data = await res.json();
      setReporte(data);
    } catch (e) {
      console.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const exportarExcelFiasInstitucional = async () => {
  const workbook = new ExcelJS.Workbook();
  
  // Agrupamos por funcionario para crear las pestañas
  const funcionariosUnicos = [...new Set(reporte.map((r: any) => r.empleado))];

  for (const nombreFuncionario of funcionariosUnicos) {
    const sheet = workbook.addWorksheet(nombreFuncionario.substring(0, 31));
    const datos = reporte.filter((r: any) => r.empleado === nombreFuncionario);
    const cargo = datos[0]?.cargo || 'N/A';

    // CONFIGURACIÓN DE COLUMNAS (Anchos fieles a la plantilla)
    sheet.columns = [
      { header: 'FECHA', key: 'fecha', width: 12 },
      { header: 'DÍA', key: 'dia', width: 12 },
      { header: 'NOVEDAD', key: 'novedad', width: 15 },
      { header: 'DETALLE', key: 'detalle', width: 15 },
      { header: 'BIOMÉTRICO', key: 'bio', width: 15 },
      { header: 'INICIO REAL', key: 'ini_real', width: 15 },
      { header: 'FIN JORNADA', key: 'fin', width: 15 },
      { header: 'INI DESCANSO', key: 'ini_desc', width: 12 },
      { header: 'FIN DESCANSO', key: 'fin_desc', width: 12 },
      { header: 'T. DESC. BIO', key: 't_desc_b', width: 12 },
      { header: 'TOTAL DESC.', key: 't_desc', width: 12 },
      { header: 'H. TRABAJADAS', key: 'h_trab', width: 15 },
      { header: 'EXTRAS', key: 'extras', width: 10 },
      { header: 'H. MENOS', key: 'menos', width: 10 },
      { header: 'OBSERVACIONES', key: 'obs', width: 30 },
    ];

    // --- ENCABEZADO INSTITUCIONAL ---
    sheet.mergeCells('A1:O1');
    const title = sheet.getCell('A1');
    title.value = 'FONDO DE INVERSIÓN AMBIENTAL SOSTENIBLE - FIAS';
    title.font = { name: 'Arial', size: 14, bold: true, color: { argb: '4472C4' } };
    title.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:O2');
    sheet.getCell('A2').value = 'REGISTRO MENSUAL DE ASISTENCIA Y PERMANENCIA';
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getCell('A2').font = { bold: true };

    // BLOQUE DE DATOS DEL FUNCIONARIO
    sheet.getCell('A4').value = 'FUNCIONARIO:';
    sheet.getCell('B4').value = nombreFuncionario;
    sheet.getCell('A5').value = 'CARGO:';
    sheet.getCell('B5').value = cargo;
    sheet.getCell('L4').value = 'MES:';
    sheet.getCell('M4').value = filtros.mes;
    sheet.getCell('L5').value = 'AÑO:';
    sheet.getCell('M5').value = filtros.anio;
    ['A4', 'A5', 'L4', 'L5'].forEach(c => sheet.getCell(c).font = { bold: true });

    // --- FILA DE ENCABEZADOS DE TABLA (Fila 7) ---
    const nombresCabeceras = [
      'FECHA', 
      'DÍA', 
      'NOVEDAD', 
      'DETALLE', 
      'BIOMÉTRICO (E)', 
      'INICIO JORNADA REAL', 
      'FIN JORNADA', 
      'INI DESCANSO', 
      'FIN DESCANSO', 
      'T. DESC. BIO', 
      'TOTAL DESC.', 
      'H. TRABAJADAS', 
      'EXTRAS', 
      'H. MENOS', 
      'OBSERVACIONES'
    ];

    // 2. Acceder a la fila 7 y asignar los valores
    const headerRow = sheet.getRow(7);
    headerRow.values = nombresCabeceras;
    headerRow.height = 35; // Altura suficiente para texto con ajuste

    // 3. Aplicar el estilo Institucional FIAS a cada celda de la cabecera
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' } // Azul Institucional
      };
      cell.font = {
        color: { argb: 'FFFFFF' }, // Texto Blanco
        bold: true,
        size: 9,
        name: 'Arial'
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true // Permitir que el texto se parta en dos líneas
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // IMPORTANTE: Mapear los datos para que coincidan con estas columnas
    datos.forEach((r: any) => {
      const row = sheet.addRow([
        r.fecha,
        new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-EC', { weekday: 'long' }),
        r.novedad,
        (r.novedad === 'LIBRE' || r.novedad === 'FIN DE SEMANA') ? 'NO LABORABLE' : 'LABORAL',
        r.biometrico,
        r.inicio_real,
        r.fin_jornada,
        r.ini_descanso,
        r.fin_descanso,
        '01:00:00', // Descanso Biométrico fijo
        '01:00:00', // Total Descanso fijo
        r.horas_trabajadas,
        r.horas_extras,
        r.horas_menos,
        r.novedad === 'ATRASO' ? 'EXCEDE TOLERANCIA 08:45' : ''
      ]);

         // Estilos por fila
      row.eachCell((cell, colNumber) => {
        cell.font = { size: 9 };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { horizontal: 'center' };

        // Colorear Fines de semana / Feriados en gris
        if (r.novedad === 'LIBRE') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
          cell.font = { color: { argb: 'A6A6A6' }, size: 9 };
        }

        // Columnas Amarillas (Inicio/Fin Jornada)
        if ((colNumber === 6 || colNumber === 7) && r.novedad !== 'LIBRE') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
        }
        
        // Columna Horas Menos (Rosado alerta)
        if (colNumber === 14 && r.horas_menos !== '00:00:00' && r.novedad !== 'LIBRE') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE4D6' } };
          cell.font = { color: { argb: '9C0006' }, bold: true };
        }
      });
    });

    // --- CUADRO DE FIRMAS (Al final de la tabla) ---
    const ultimaFila = 7 + datos.length + 3;
    
    sheet.mergeCells(`B${ultimaFila}:E${ultimaFila}`);
    sheet.getCell(`B${ultimaFila}`).value = '__________________________';
    sheet.getCell(`B${ultimaFila + 1}`).value = 'ELABORADO POR (F):';
    sheet.getCell(`B${ultimaFila + 2}`).value = nombreFuncionario;

    sheet.mergeCells(`K${ultimaFila}:N${ultimaFila}`);
    sheet.getCell(`K${ultimaFila}`).value = '__________________________';
    sheet.getCell(`K${ultimaFila + 1}`).value = 'VALIDADO POR (F):';
    sheet.getCell(`K${ultimaFila + 2}`).value = 'TALENTO HUMANO / RESPONSABLE';

    [sheet.getCell(`B${ultimaFila + 1}`), sheet.getCell(`K${ultimaFila + 1}`)].forEach(c => {
      c.font = { bold: true, size: 9 };
      c.alignment = { horizontal: 'center' };
    });
  }

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `REPORTE_INSTITUCIONAL_FIAS_${filtros.anio}_${filtros.mes}.xlsx`);
};

  const dataFiltrada = reporte.filter((r: any) => 
    r.empleado.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1900px] mx-auto space-y-4">
        
        {/* CABECERA INSTITUCIONAL */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-[12px] border-[#4472C4] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Sistema de Asistencia FIAS</h1>
            <p className="text-[#4472C4] font-bold text-xs tracking-widest uppercase tracking-widest">Control Ecuador 2025/2026 - Tolerancia 15 min</p>
          </div>
          <button 
            onClick={exportarExcelFiasInstitucional} 
            disabled={reporte.length === 0}
            className="bg-[#1D6F42] hover:bg-[#155231] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-30"
          >
            <FiDownload size={20} /> EXPORTAR HOJA GLOBAL
          </button>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-1"><FiUser size={12}/> Funcionario</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 shadow-sm" value={filtros.funcionarioId} onChange={e => setFiltros({...filtros, funcionarioId: e.target.value})}>
              <option value="todos">-- TODOS LOS FUNCIONARIOS --</option>
              {funcionarios.map((f: any) => <option key={f.funcionario_id} value={f.funcionario_id}>{f.apellidos} {f.nombres}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-1"><FiCalendar size={12}/> Año</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700" value={filtros.anio} onChange={e => setFiltros({...filtros, anio: e.target.value})}>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-1"><FiClock size={12}/> Mes</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700" value={filtros.mes} onChange={e => setFiltros({...filtros, mes: e.target.value})}>
              {meses.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button onClick={generarData} className="w-full bg-[#4472C4] text-white py-3.5 rounded-xl font-black text-[11px] uppercase hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md">
              {loading ? 'PROCESANDO...' : <><FiPlay /> GENERAR</>}
            </button>
          </div>
          <div className="md:col-span-2">
             <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input type="text" placeholder="Filtrar nombre..." className="w-full pl-9 pr-3 py-3 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-600 outline-none" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
             </div>
          </div>
        </div>

        {/* TABLA GLOBAL */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full text-center border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-[#4472C4] text-white font-bold uppercase divide-x divide-white/20 sticky top-0 z-20">
                  <th className="p-3 w-16">Fecha</th>
                  <th className="p-3 w-20">Día</th>
                  <th className="p-3 w-24">Novedad</th>
                  <th className="p-3 w-24">Detalle</th>
                  <th className="p-3 w-24 bg-[#3359a1]">Biométrico (E)</th>
                  <th className="p-3 w-24 bg-[#f7e4a6] text-slate-900">In. Jornada Real</th>
                  <th className="p-3 w-24 bg-[#f7e4a6] text-slate-900">Fin Jornada</th>
                  <th className="p-3 w-24">In. Descanso</th>
                  <th className="p-3 w-24">Fin Descanso</th>
                  <th className="p-3 w-24 bg-[#cedef0] text-slate-900">Tot. Descanso</th>
                  <th className="p-3 w-24 bg-[#f5d4a4] text-slate-900 font-bold uppercase">Total Descanso</th>
                  <th className="p-3 w-24 bg-[#3359a1]">H. Trabajadas</th>
                  <th className="p-3 w-24 bg-[#FFE699] text-slate-900">Extras</th>
                  <th className="p-3 w-24 bg-[#FFD966] text-red-900">H. Menos</th>
                  <th className="p-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {dataFiltrada.map((r: any, i) => {
                  const dObj = new Date(r.fecha + 'T00:00:00');
                  const nDia = dObj.toLocaleDateString('es-EC', { weekday: 'long' });
                  
                  // Detección de estados para colores
                  const esLibre = r.novedad === 'LIBRE' || r.novedad === 'FIN DE SEMANA';
                  const esAtrasoReal = r.novedad === 'ATRASO';
                  const esTolerancia = r.novedad === 'NORMAL (TOLERANCIA)';

                  let colorNovedad = "text-emerald-700 bg-emerald-50";
                  let colorInicioReal = "bg-[#FFF2CC] text-slate-900"; // Amarillo FIAS

                  if (esLibre) {
                    colorNovedad = "text-slate-400 bg-slate-50";
                    colorInicioReal = "bg-transparent text-slate-400 font-normal";
                  } else if (esAtrasoReal) {
                    colorNovedad = "text-red-700 bg-red-50";
                    colorInicioReal = "bg-red-600 text-white animate-pulse";
                  } else if (esTolerancia) {
                    colorNovedad = "text-emerald-700 bg-emerald-50"; // Se muestra como normal
                    colorInicioReal = "bg-[#FFF2CC] text-slate-900"; // Amarillo sin alerta
                  } else if (r.novedad === 'SIN REGISTRO') {
                    colorNovedad = "text-slate-500 bg-slate-50";
                    colorInicioReal = "bg-slate-100 text-slate-400 italic";
                  }

                  return (
                    <tr key={i} className={`hover:bg-blue-50/50 transition-colors ${esLibre ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}>
                      <td className="p-2.5 border-r border-slate-100">{r.fecha.split('-').reverse().slice(0,2).join('. ')}</td>
                      <td className="p-2.5 border-r border-slate-100 lowercase font-medium italic">{nDia}</td>
                      <td className={`p-2.5 border-r border-slate-100 uppercase text-[9px] ${colorNovedad}`}>
                        {esLibre ? 'NO LABORABLE' : (esTolerancia ? 'NORMAL' : r.novedad)}
                      </td>
                      <td className="p-2.5 border-r border-slate-100 uppercase text-[8px] font-bold">
                        {esLibre ? 'LIBRE' : (r.novedad === 'SIN REGISTRO' ? 'NO LABORADO' : 'TRABAJO')}
                      </td>
                      <td className="p-2.5 border-r border-slate-100 text-[#4472C4] font-black">{r.biometrico}</td>
                      
                      {/* CELDA DE INICIO JORNADA REAL */}
                      <td className={`p-2.5 border-r border-slate-100 font-black ${colorInicioReal}`}>
                        {r.inicio_real}
                      </td>

                      <td className="p-2.5 border-r border-slate-100 bg-[#FFF2CC] text-slate-900">{r.fin_jornada}</td>
                      <td className="p-2.5 border-r border-slate-100 text-slate-400 font-normal italic">{r.ini_descanso}</td>
                      <td className="p-2.5 border-r border-slate-100 text-slate-400 font-normal italic">{r.fin_descanso}</td>
                      <td className="p-2.5 border-r border-slate-100 bg-[#DDEBF7] text-slate-800 font-bold">{r.total_descanso}</td>
                      <td className="p-2.5 border-r border-slate-100 bg-[#FCE4D6] text-red-700 font-black uppercase">1:00:00</td>
                      <td className="p-2.5 border-r border-slate-100 bg-slate-50 font-black text-slate-900 text-[12px]">{r.horas_trabajadas}</td>
                      <td className="p-2.5 border-r border-slate-100 bg-[#FFE699] text-slate-900 font-bold">{r.horas_extras}</td>
                      <td className="p-2.5 border-r border-slate-100 bg-[#FFD966] text-red-900 font-bold">{r.horas_menos}</td>
                      
                      <td className={`p-2.5 text-[9px] font-black ${esAtrasoReal ? 'bg-[#F4B084] text-slate-900' : 'text-slate-400 font-normal italic'}`}>
                        {esLibre ? 'Feriado / Fin de semana' : (esTolerancia ? 'Rango tolerancia' : r.novedad)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}