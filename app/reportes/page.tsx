'use client';
import { useState, useEffect } from 'react';
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
      if (res.ok) {
        setReporte(data);
      }
    } catch (e) {
      console.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const exportarExcelFiasInstitucional = async () => {
    const workbook = new ExcelJS.Workbook();
    const funcionariosUnicos = [...new Set(reporte.map((r: any) => r.empleado))];

    for (const nombreFuncionario of funcionariosUnicos) {
      const sheet = workbook.addWorksheet(nombreFuncionario.substring(0, 31));
      
      // --- MODIFICACIÓN PARA EVITAR ERROR DE COMPILACIÓN ---
      // Forzamos a que 'datos' sea tratado como un array de objetos (any[])
      const datos = reporte.filter((r: any) => r.empleado === nombreFuncionario) as any[];
      const cargo = datos[0]?.cargo || 'N/A';
      // ----------------------------------------------------

      // Configuración de Columnas
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

      // Encabezado Institucional
      sheet.mergeCells('A1:O1');
      const title = sheet.getCell('A1');
      title.value = 'FONDO DE INVERSIÓN AMBIENTAL SOSTENIBLE - FIAS';
      title.font = { name: 'Arial', size: 14, bold: true, color: { argb: '4472C4' } };
      title.alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:O2');
      sheet.getCell('A2').value = 'REGISTRO MENSUAL DE ASISTENCIA Y PERMANENCIA';
      sheet.getCell('A2').alignment = { horizontal: 'center' };
      sheet.getCell('A2').font = { bold: true };

      // Datos Funcionario
      sheet.getCell('A4').value = 'FUNCIONARIO:';
      sheet.getCell('B4').value = nombreFuncionario;
      sheet.getCell('A5').value = 'CARGO:';
      sheet.getCell('B5').value = cargo;
      sheet.getCell('L4').value = 'MES:';
      sheet.getCell('M4').value = filtros.mes;
      sheet.getCell('L5').value = 'AÑO:';
      sheet.getCell('M5').value = filtros.anio;
      ['A4', 'A5', 'L4', 'L5'].forEach(c => sheet.getCell(c).font = { bold: true });

      // Estilo Cabecera Tabla (Fila 7)
      const headerRow = sheet.getRow(7);
      headerRow.values = ['FECHA', 'DÍA', 'NOVEDAD', 'DETALLE', 'BIOMÉTRICO (E)', 'INICIO JORNADA REAL', 'FIN JORNADA', 'INI DESCANSO', 'FIN DESCANSO', 'T. DESC. BIO', 'TOTAL DESC.', 'H. TRABAJADAS', 'EXTRAS', 'H. MENOS', 'OBSERVACIONES'];
      headerRow.height = 35;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      // Mapeo de Datos
      datos.forEach((r: any) => {
        const row = sheet.addRow([
          r.fecha,
          new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-EC', { weekday: 'long' }),
          r.novedad,
          r.novedad === 'LIBRE' ? 'NO LABORABLE' : 'LABORAL',
          r.biometrico,
          r.inicio_real,
          r.fin_jornada,
          r.ini_descanso,
          r.fin_descanso,
          r.total_descanso,
          '01:00:00', // Total descanso fijo institucional
          r.horas_trabajadas,
          r.horas_extras,
          r.horas_menos,
          r.novedad === 'ATRASO' ? 'EXCEDE TOLERANCIA 08:45' : ''
        ]);

        row.eachCell((cell, colNumber) => {
          cell.font = { size: 9 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          
          if (r.novedad === 'LIBRE') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
          }
          if ((colNumber === 6 || colNumber === 7) && r.novedad !== 'LIBRE') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
          }
        });
      });

      // Firmas
      const ultimaFila = 7 + datos.length + 3;
      sheet.getCell(`B${ultimaFila}`).value = '__________________________';
      sheet.getCell(`B${ultimaFila + 1}`).value = 'ELABORADO POR (F):';
      sheet.getCell(`B${ultimaFila + 2}`).value = nombreFuncionario;
      sheet.getCell(`K${ultimaFila}`).value = '__________________________';
      sheet.getCell(`K${ultimaFila + 1}`).value = 'VALIDADO POR (F):';
      sheet.getCell(`K${ultimaFila + 2}`).value = 'TALENTO HUMANO / RESPONSABLE';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `REPORTE_ASISTENCIA_${filtros.anio}_${filtros.mes}.xlsx`);
  };

  const dataFiltrada = reporte.filter((r: any) => 
    r.empleado.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Superior */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 p-8 border-l-[12px] border-[#4472C4] flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Panel de <span className="text-[#4472C4]">Asistencia</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Ecuador 2026</span>
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tolerancia Activa: 15 min</span>
            </div>
          </div>
          <button 
            onClick={exportarExcelFiasInstitucional} 
            disabled={reporte.length === 0}
            className="bg-[#1D6F42] hover:bg-[#155231] text-white px-10 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-20"
          >
            <FiDownload size={18} /> EXPORTAR EXCEL INSTITUCIONAL
          </button>
        </div>

        {/* Filtros Inteligentes */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end border border-slate-100">
          <div className="md:col-span-4">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-2">Funcionario Seleccionado</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-3.5 text-slate-400" />
              <select className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 ring-blue-500/20 transition-all" value={filtros.funcionarioId} onChange={e => setFiltros({...filtros, funcionarioId: e.target.value})}>
                <option value="todos">Todos los Colaboradores</option>
                {funcionarios.map((f: any) => <option key={f.funcionario_id} value={f.funcionario_id}>{f.apellidos} {f.nombres}</option>)}
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
             <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-2">Periodo / Año</label>
             <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none" value={filtros.anio} onChange={e => setFiltros({...filtros, anio: e.target.value})}>
               {anios.map(a => <option key={a} value={a}>{a}</option>)}
             </select>
          </div>
          <div className="md:col-span-2">
             <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-2">Mes de Reporte</label>
             <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none" value={filtros.mes} onChange={e => setFiltros({...filtros, mes: e.target.value})}>
               {meses.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
             </select>
          </div>
          <div className="md:col-span-2">
            <button onClick={generarData} disabled={loading} className="w-full bg-[#4472C4] text-white py-4 rounded-2xl font-black text-[11px] uppercase hover:bg-slate-900 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><FiPlay /> GENERAR</>}
            </button>
          </div>
          <div className="md:col-span-2">
             <div className="relative">
                <FiSearch className="absolute left-4 top-4 text-slate-400" />
                <input type="text" placeholder="Buscar..." className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold text-slate-600 outline-none placeholder:text-slate-400" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
             </div>
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[650px]">
            <table className="w-full text-center border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#4472C4] text-white font-bold uppercase sticky top-0 z-30 shadow-md">
                  <th className="p-4 w-20">Fecha</th>
                  <th className="p-4 w-24">Día</th>
                  <th className="p-4 w-32">Novedad</th>
                  <th className="p-4 w-24 bg-blue-700/30">Bio (E)</th>
                  <th className="p-4 w-24 bg-[#facc15] text-slate-900">In. Jornada</th>
                  <th className="p-4 w-24 bg-[#facc15] text-slate-900">Fin Jornada</th>
                  <th className="p-4 w-24">In. Descanso</th>
                  <th className="p-4 w-24">Fin Descanso</th>
                  <th className="p-4 w-28 bg-emerald-600/10 text-emerald-800">H. Trab</th>
                  <th className="p-4 w-20 text-rose-300">Menos</th>
                  <th className="p-4">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataFiltrada.map((r: any, i) => {
                  const esLibre = r.novedad === 'LIBRE' || r.novedad === 'FIN DE SEMANA';
                  const esAtraso = r.novedad === 'ATRASO';
                  const esTolerancia = r.novedad === 'NORMAL (TOLERANCIA)';

                  return (
                    <tr key={i} className={`group hover:bg-slate-50 transition-colors ${esLibre ? 'bg-slate-50/50 text-slate-400' : 'bg-white text-slate-700'}`}>
                      <td className="p-3 border-r border-slate-50 font-medium">{r.fecha.split('-').reverse().slice(0,2).join('/')}</td>
                      <td className="p-3 border-r border-slate-50 lowercase italic font-medium">{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-EC', { weekday: 'long' })}</td>
                      <td className="p-3 border-r border-slate-50">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          esLibre ? 'bg-slate-200 text-slate-500' : 
                          esAtraso ? 'bg-rose-100 text-rose-600' : 
                          esTolerancia ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {esTolerancia ? 'NORMAL (T)' : r.novedad}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-50 font-black text-blue-600">{r.biometrico}</td>
                      <td className={`p-3 border-r border-slate-100 font-black ${esAtraso ? 'text-rose-600' : 'text-slate-900'}`}>{r.inicio_real}</td>
                      <td className="p-3 border-r border-slate-100 font-black text-slate-900">{r.fin_jornada}</td>
                      <td className="p-3 border-r border-slate-50 text-slate-400 italic">{r.ini_descanso}</td>
                      <td className="p-3 border-r border-slate-50 text-slate-400 italic">{r.fin_descanso}</td>
                      <td className="p-3 border-r border-slate-50 bg-emerald-50/30 font-black text-emerald-700 text-xs">{r.horas_trabajadas}</td>
                      <td className={`p-3 border-r border-slate-50 font-bold ${r.horas_menos !== '00:00:00' ? 'text-rose-600' : 'text-slate-300'}`}>{r.horas_menos}</td>
                      <td className="p-3 text-left pl-6 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {esAtraso ? 'Excede 15 min de gracia' : r.novedad === 'SIN REGISTRO' ? 'Falta de marcación' : ''}
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