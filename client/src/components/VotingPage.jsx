import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function VotingPage() {
    const [cedula, setCedula] = useState('');
    const [step, setStep] = useState('cedula');
    const [voter, setVoter] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (step === 'voting') {
            fetchCandidates();
        }
    }, [step]);

    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${API_URL}/candidates`);
            setCandidates(response.data);
        } catch (error) {
            console.error('Error fetching candidates:', error);
            setError('Error al cargar los candidatos');
        }
    };

    const handleVerifyCedula = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/voters/verify`, { cedula });
            if (response.data.success) {
                setVoter(response.data.voter);
                setStep('voting');
            }
        } catch (error) {
            if (error.response) {
                setError(error.response.data.error);
            } else {
                setError('Error de conexión con el servidor');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (candidateId) => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/votes`, {
                voter_id: voter.id,
                candidate_id: candidateId
            });
            alert('¡Voto registrado exitosamente!');
            setStep('cedula');
            setCedula('');
            setVoter(null);
        } catch (error) {
            setError('Error al registrar el voto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section">
            <div className="section-header">
                <div className="section-tag">Sufragio electrónico</div>
                <h1 className="section-title">Sistema de <em>Votación</em></h1>
            </div>

            {error && <div className="pill pill-red" style={{ marginBottom: '20px' }}>{error}</div>}

            {step === 'cedula' && (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="card-icon-wrap icon-gold" style={{ marginBottom: '20px' }}>
                        <i className="fas fa-id-card"></i>
                    </div>
                    <h3>Verificación de identidad</h3>
                    <form onSubmit={handleVerifyCedula}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Número de Cédula</label>
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                                placeholder="Ej: 12345678"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, var(--green), var(--green2))',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '40px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'transform 0.2s'
                            }}
                        >
                            {loading ? 'Verificando...' : 'Verificar Cédula'}
                        </button>
                    </form>
                </div>
            )}

            {step === 'voting' && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div className="pill pill-green">Bienvenido, {voter?.nombre}</div>
                        <p style={{ marginTop: '12px', color: 'var(--muted)' }}>Selecciona a tu candidato preferido</p>
                    </div>
                    <div className="cards-grid">
                        {candidates.map((candidate) => (
                            <div key={candidate.id} className="card" style={{ textAlign: 'center' }}>
                                <img
                                    src={candidate.foto_url}
                                    alt={candidate.nombre}
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '60px',
                                        objectFit: 'cover',
                                        margin: '0 auto 16px',
                                        border: '2px solid var(--gold)'
                                    }}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/128'; }}
                                />
                                <h3>{candidate.nombre}</h3>
                                <button
                                    onClick={() => handleVote(candidate.id)}
                                    disabled={loading}
                                    className="pill pill-green"
                                    style={{ marginTop: '20px', cursor: 'pointer', width: '100%' }}
                                >
                                    {loading ? 'Procesando...' : 'Votar'}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default VotingPage;