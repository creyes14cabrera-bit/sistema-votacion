import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

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
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">Sistema de Votación</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {step === 'cedula' && (
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleVerifyCedula}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Número de Cédula
                            </label>
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ingrese su número de cédula"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {loading ? 'Verificando...' : 'Verificar Cédula'}
                        </button>
                    </form>
                </div>
            )}

            {step === 'voting' && (
                <div>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">Bienvenido, {voter?.nombre}</h2>
                        <p className="text-gray-600">Selecciona a tu candidato preferido</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {candidates.map((candidate) => (
                            <div key={candidate.id} className="bg-white rounded-lg shadow-md p-6 text-center">
                                <img
                                    src={candidate.foto_url}
                                    alt={candidate.nombre}
                                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/128'; }}
                                />
                                <h3 className="text-xl font-semibold mb-4">{candidate.nombre}</h3>
                                <button
                                    onClick={() => handleVote(candidate.id)}
                                    disabled={loading}
                                    className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 disabled:bg-gray-400"
                                >
                                    Votar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VotingPage;