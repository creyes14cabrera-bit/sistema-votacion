import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/admin/login`, { username, password });
            localStorage.setItem('adminToken', response.data.token);
            navigate('/admin/dashboard');
        } catch (error) {
            const msg = error.response?.data?.error || 'Error de conexión';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section">
            <div className="section-header">
                <div className="section-tag">Acceso restringido</div>
                <h1 className="section-title">Panel de <em>Administrador</em></h1>
            </div>
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                {error && <div className="pill pill-red" style={{ marginBottom: '20px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'rgba(0,0,0,0.3)',
                                color: '#fff'
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'rgba(0,0,0,0.3)',
                                color: '#fff'
                            }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
                            color: '#0a1628',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '40px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminLogin;