import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin');
            return;
        }
        fetchStats(token);
        fetchVoters(token);
    }, [navigate]);

    const fetchStats = async (token) => {
        try {
            const response = await axios.get(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (err) {
            handleAuthError(err);
        }
    };

    const fetchVoters = async (token) => {
        try {
            const response = await axios.get(`${API_URL}/admin/voters`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVoters(response.data);
        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthError = (err) => {
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('adminToken');
            navigate('/admin');
        } else {
            setError('Error al cargar los datos');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin');
    };

    // --- Nueva función para importar Excel ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        setUploadMessage(null);
        const token = localStorage.getItem('adminToken');

        try {
            const response = await axios.post(`${API_URL}/admin/import-voters`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setUploadMessage({ type: 'success', text: response.data.message });
            // Refrescar datos después de importar
            fetchStats(token);
            fetchVoters(token);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Error al subir el archivo.';
            setUploadMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
            // Limpiar el input file
            event.target.value = null;
        }
    };

    if (loading) return <div className="section">Cargando estadísticas...</div>;

    return (
        <div className="section">
            <div className="section-header">
                <div className="section-tag">Panel de Control</div>
                <h1 className="section-title">Gestión de la <em>Votación</em></h1>
                <button onClick={handleLogout} className="pill pill-red" style={{ marginTop: '20px', cursor: 'pointer' }}>
                    <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>

            {error && <div className="pill pill-red">{error}</div>}

            {stats && (
                <>
                    <div className="stats-bar">
                        <div className="stat">
                            <span className="stat-num">{stats.total_voters}</span>
                            <span className="stat-label">Total Votantes</span>
                        </div>
                        <div className="stat">
                            <span className="stat-num">{stats.voted_count}</span>
                            <span className="stat-label">Votos Emitidos</span>
                        </div>
                        <div className="stat">
                            <span className="stat-num">{stats.pending_voters}</span>
                            <span className="stat-label">Pendientes</span>
                        </div>
                        <div className="stat">
                            <span className="stat-num">{stats.participation_percentage}%</span>
                            <span className="stat-label">Participación</span>
                        </div>
                    </div>

                    <div className="cards-grid" style={{ marginBottom: '48px' }}>
                        {stats.candidates.map(c => (
                            <div className="card" key={c.id}>
                                <div className="card-icon-wrap icon-gold">
                                    <i className="fas fa-user-check"></i>
                                </div>
                                <h3>{c.nombre}</h3>
                                <p>{c.votes} votos</p>
                                <div className="card-badge">{((c.votes / stats.voted_count) * 100 || 0).toFixed(1)}%</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* SECCIÓN DE IMPORTAR VOTANTES */}
            <div className="section-header" style={{ marginTop: '40px' }}>
                <div className="section-tag">Herramientas</div>
                <h2 className="section-title">Importar <em>Votantes</em> desde Excel</h2>
            </div>
            <div className="card">
                <div className="card-icon-wrap icon-gold">
                    <i className="fas fa-file-excel"></i>
                </div>
                <p style={{ marginBottom: '16px' }}>
                    Selecciona un archivo Excel (.xlsx o .xls) con las columnas <strong>cedula</strong> y <strong>nombre</strong>.
                </p>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ marginBottom: '16px', display: 'block' }}
                />
                {uploading && <div className="pill pill-gold">Subiendo y procesando archivo...</div>}
                {uploadMessage && (
                    <div className={`pill ${uploadMessage.type === 'success' ? 'pill-green' : 'pill-red'}`}>
                        {uploadMessage.text}
                    </div>
                )}
            </div>

            <div className="section-header">
                <div className="section-tag">Detalle de votantes</div>
                <h2 className="section-title">Estado de <em>participación</em></h2>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '16px', textAlign: 'left' }}>Cédula</th>
                            <th style={{ padding: '16px', textAlign: 'left' }}>Nombre</th>
                            <th style={{ padding: '16px', textAlign: 'left' }}>Estado</th>
                            <th style={{ padding: '16px', textAlign: 'left' }}>Fecha de voto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {voters.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px' }}>{v.cedula}</td>
                                <td style={{ padding: '12px 16px' }}>{v.nombre}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    {v.has_voted ? (
                                        <span className="pill pill-green" style={{ fontSize: '0.75rem' }}>✔️ Votó</span>
                                    ) : (
                                        <span className="pill pill-orange" style={{ fontSize: '0.75rem' }}>⏳ Pendiente</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px' }}>{v.voted_at ? new Date(v.voted_at).toLocaleString() : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;