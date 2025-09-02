'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  // Form para criar/editar usuário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true
  });

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Não autorizado');
      }

      const userData = await response.json();
      if (userData.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      setCurrentUser(userData);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      router.push('/');
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar estatísticas
      const statsResponse = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Carregar usuários
      const usersResponse = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

    } catch (error) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '', role: 'USER', isActive: true });
        loadDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      setError('Erro ao criar usuário');
      console.error('Erro:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      setError('Erro ao excluir usuário');
      console.error('Erro:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        loadDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      setError('Erro ao atualizar usuário');
      console.error('Erro:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1>Painel Administrativo</h1>
        <div className={styles.headerActions}>
          <span>Olá, {currentUser?.name}</span>
          <button onClick={logout} className={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total de Usuários</h3>
            <p className={styles.statNumber}>{stats.totalUsers}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Usuários Ativos</h3>
            <p className={styles.statNumber}>{stats.activeUsers}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Conversas Totais</h3>
            <p className={styles.statNumber}>{stats.totalConversations}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Mensagens Totais</h3>
            <p className={styles.statNumber}>{stats.totalMessages}</p>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className={styles.actions}>
        <button 
          onClick={() => setShowCreateForm(true)}
          className={styles.primaryBtn}
        >
          + Criar Usuário
        </button>
        <button 
          onClick={loadDashboardData}
          className={styles.secondaryBtn}
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Modal para criar usuário */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Criar Novo Usuário</h2>
            <form onSubmit={handleCreateUser}>
              <input
                type="text"
                placeholder="Nome"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
                <option value="MODERATOR">Moderador</option>
              </select>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.primaryBtn}>
                  Criar
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className={styles.secondaryBtn}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      <div className={styles.usersSection}>
        <h2>Usuários ({users.length})</h2>
        <div className={styles.usersList}>
          {users.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <div className={styles.userMeta}>
                  <span className={`${styles.badge} ${styles[user.role.toLowerCase()]}`}>
                    {user.role}
                  </span>
                  <span className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className={styles.userDates}>
                  Criado: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  {user.lastLogin && (
                    <>
                      <br />
                      Último login: {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                    </>
                  )}
                </p>
              </div>
              <div className={styles.userActions}>
                <button
                  onClick={() => toggleUserStatus(user.id, user.isActive)}
                  className={user.isActive ? styles.deactivateBtn : styles.activateBtn}
                >
                  {user.isActive ? 'Desativar' : 'Ativar'}
                </button>
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className={styles.deleteBtn}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
