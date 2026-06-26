import React, { useState, useEffect, useCallback } from 'react';

// --- CONFIGURACIÓN ---
const API_URL = "https://invapi-gcbng0cseqcnamdt.centralus-01.azurewebsites.net";
const ADMIN_PASS = "Admin2026*"; 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [corridas, setCorridas] = useState([]); 
  const [idSeleccionado, setIdSeleccionado] = useState(null); 
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- ESTADOS PARA GESTIÓN DE CATÁLOGOS ---
  const [showGestion, setShowGestion] = useState(false);
  const [listaU, setListaU] = useState([]);
  const [listaA, setListaA] = useState([]);
  const [nombreU, setNombreU] = useState("");
  const [nombreA, setNombreA] = useState("");

  // 1. CARGAR LISTA DE TOMAS (CORRIDAS)
  const fetchCorridas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/corridas`);
      if (!res.ok) throw new Error("Error cargando tomas");
      const data = await res.json();
      setCorridas(data);
      if (data.length > 0 && !idSeleccionado) {
        setIdSeleccionado(data[0].id);
      }
    } catch (e) {
      console.error("Error corridas", e);
    }
  }, [idSeleccionado]);

  // 2. CARGAR DETALLE DE LA TOMA SELECCIONADA
  const fetchInventario = useCallback(async () => {
    if (!idSeleccionado) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/consultar-todo/${idSeleccionado}`); 
      if (!res.ok) throw new Error("Error en el servidor");
      const data = await res.json();
      setDatos(Array.isArray(data) ? data : []); 
      setError(null);
    } catch (e) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [idSeleccionado]);

  // 3. CARGAR CATÁLOGOS (USUARIOS Y ALMACENES)
  const cargarCatalogos = async () => {
    try {
      const [resU, resA] = await Promise.all([
        fetch(`${API_URL}/usuarios-list`),
        fetch(`${API_URL}/almacenes-list`)
      ]);
      setListaU(await resU.json());
      setListaA(await resA.json());
    } catch (e) { console.error("Error catálogos", e); }
  };

  // --- ACCIONES CRUD ---
  const agregarItem = async (tipo) => {
    const valor = tipo === 'U' ? nombreU : nombreA;
    const endpoint = tipo === 'U' ? 'usuarios-add' : 'almacenes-add';
    if (!valor) return;
    await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ nombre: valor })
    });
    tipo === 'U' ? setNombreU("") : setNombreA("");
    cargarCatalogos();
  };

  const eliminarItem = async (tipo, id) => {
    const endpoint = tipo === 'U' ? 'usuarios-delete' : 'almacenes-delete';
    if (!window.confirm("¿Eliminar este registro?")) return;
    await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
    });
    cargarCatalogos();
  };

  // 4. EFECTOS
  useEffect(() => {
    if (isLoggedIn) {
      fetchCorridas();
      cargarCatalogos();
      const interval = setInterval(fetchCorridas, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchCorridas]);

  useEffect(() => {
    if (isLoggedIn && idSeleccionado) {
      fetchInventario();
      const interval = setInterval(fetchInventario, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, idSeleccionado, fetchInventario]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) setIsLoggedIn(true);
    else alert("Contraseña incorrecta");
  };

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return "---";
    const d = new Date(fechaRaw);
    return d.toLocaleString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit', 
        month: '2-digit' 
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800">ADMIN PANEL</h2>
            <p className="text-slate-500 font-medium">Inventario La Tiendita</p>
          </div>
          <div className="mb-6">
            <input 
              type="password" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="Contraseña de acceso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
            INGRESAR AL MONITOR
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase">Monitor Inventario</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGestion(!showGestion)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${showGestion ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {showGestion ? 'CERRAR GESTIÓN' : 'GESTIONAR LISTAS'}
            </button>

            <select 
              className="bg-slate-100 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              value={idSeleccionado || ''}
              onChange={(e) => setIdSeleccionado(e.target.value)}
            >
              {corridas.map(c => (
                <option key={c.id} value={c.id}>
                  Toma #{c.id} - {new Date(c.fecha_inicio).toLocaleDateString()} {c.activa ? ' (ACTIVA)' : ''}
                </option>
              ))}
            </select>

            <button 
              onClick={fetchInventario}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${loading ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {loading ? "..." : "REFRESCAR"}
            </button>
            <a 
              href={`${API_URL}/exportar-csv/${idSeleccionado}`} 
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-100 transition-all"
            >
              CSV
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {error && <div className="bg-red-50 text-red-600 p-4 mb-8 rounded-xl border border-red-100">⚠️ {error}</div>}

        {/* --- SECCIÓN DE GESTIÓN (COLAPSABLE) --- */}
        {showGestion && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Usuarios */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Usuarios App</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 border border-slate-200 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Nuevo usuario..." 
                  value={nombreU}
                  onChange={(e) => setNombreU(e.target.value)}
                />
                <button onClick={() => agregarItem('U')} className="bg-blue-600 text-white px-4 rounded-lg font-bold">+</button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {listaU.map(u => (
                  <div key={u.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                    <span className="text-sm font-medium">{u.nombre}</span>
                    <button onClick={() => eliminarItem('U', u.id)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                  </div>
                ))}
              </div>
            </div>
            {/* Almacenes */}
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-sm">
              <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4">Almacenes</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 border border-slate-200 p-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Nueva bodega..." 
                  value={nombreA}
                  onChange={(e) => setNombreA(e.target.value)}
                />
                <button onClick={() => agregarItem('A')} className="bg-emerald-600 text-white px-4 rounded-lg font-bold">+</button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {listaA.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                    <span className="text-sm font-medium">{a.nombre}</span>
                    <button onClick={() => eliminarItem('A', a.id)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- CARDS DE RESUMEN --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total SKUs</p>
            <p className="text-4xl font-black text-blue-600">{new Set(datos.map(d => d.codigo)).size}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Personal en Turno</p>
            <p className="text-4xl font-black text-emerald-600">{new Set(datos.map(d => d.usuario)).size}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Piezas</p>
            <p className="text-4xl font-black text-slate-800">
              {datos.reduce((acc, curr) => acc + Number(curr.cantidad), 0)}
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${corridas.find(c => c.id == idSeleccionado)?.activa ? 'bg-green-400 animate-ping' : 'bg-red-400'}`}></div>
              <div className={`w-3 h-3 rounded-full absolute top-0 ${corridas.find(c => c.id == idSeleccionado)?.activa ? 'bg-green-400' : 'bg-red-400'}`}></div>
            </div>
            <div>
                <p className="text-white font-bold text-sm tracking-wide leading-none uppercase">
                {corridas.find(c => c.id == idSeleccionado)?.activa ? 'Toma Activa' : 'Toma Cerrada'}
                </p>
                <p className="text-slate-400 text-[9px] mt-1 uppercase font-bold tracking-tighter">Sincronización OK</p>
            </div>
          </div>
        </div>

        {/* --- TABLA PRINCIPAL --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Último Registro</th>
                  <th className="p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Almacén</th>
                  <th className="p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Producto (Código)</th>
                  <th className="p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Cant. Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.map((item, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-4 text-[11px] font-mono text-slate-400">
                        {formatearFecha(item.fecha)}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold group-hover:bg-white transition-all">
                        {item.usuario}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">{item.almacen}</td>
                    <td className="p-4">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{item.nombre}</p>
                        <p className="text-[10px] font-mono text-blue-500 font-bold mt-0.5">{item.codigo}</p>
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-black min-w-[50px] text-center">
                        {item.cantidad}
                      </span>
                    </td>
                  </tr>
                ))}
                {datos.length === 0 && !loading && (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-400 font-medium italic">
                            No hay registros para esta toma.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}