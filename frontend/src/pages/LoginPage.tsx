import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login({ username: username.trim(), password });
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-badge">
            <Lock size={26} />
          </div>
          <h2>Đăng Nhập Hệ Thống EDMS</h2>
          <p>Hệ thống Lưu trữ Điện tử & Quản lý Tài liệu</p>
        </div>

        {error && (
          <div className="alert alert-danger" id="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username-input">
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username-input"
                type="text"
                className="form-input"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="password-input">
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={isLoading}
            id="login-submit-btn"
          >
            <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

