import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin');
            return;
        }
        fetchStats(token);
    }, [navigate]);

    const fetchStats = async (token) => {
        try {
            const response = await axios.get(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('adminToken');
                navigate('/admin');
            } else {
                setError('Error al cargar las estadísticas');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl">Cargando estadísticas...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Panel de Administrador</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                >
                    Cerrar Sesión
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {stats && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-gray-500 text-sm">Total de Votantes</h3>
                            <p className="text-2xl font-bold">{stats.total_voters}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-gray-500 text-sm">Votos Emitidos</h3>
                            <p className="text-2xl font-bold">{stats.voted_count}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-gray-500 text-sm">Votos Pendientes</h3>
                            <p className="text-2xl font-bold">{stats.pending_voters}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-gray-500 text-sm">Participación</h3>
                            <p className="text-2xl font-bold">{stats.participation_percentage}%</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Resultados por Candidato</h2>
                        <div className="space-y-4">
                            {stats.candidates.map((candidate) => (
                                <div key={candidate.id} className="border-b pb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{candidate.nombre}</span>
                                        <span className="text-gray-600">{candidate.votes} votos</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            className="bg-blue-500 h-4 rounded-full"
                                            style={{
                                                width: `${stats.voted_count > 0 ? (candidate.votes / stats.voted_count) * 100 : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminDashboard;