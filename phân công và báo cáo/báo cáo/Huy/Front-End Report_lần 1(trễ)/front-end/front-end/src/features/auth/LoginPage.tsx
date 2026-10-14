import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { mockCurrentUser } from '@/services/mockData'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const doLogin = async (userEmail: string, userPass: string) => {
    setError('')
    setIsLoading(true)

    try {
      await new Promise((r) => setTimeout(r, 450))

      if (userEmail === 'admin@example.com' && userPass === 'admin123') {
        setAuth(mockCurrentUser, 'mock-jwt-token-demo')
        navigate(from, { replace: true })
      } else {
        setError('Email hoặc mật khẩu không chính xác. Hãy dùng tài khoản demo bên dưới.')
      }
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doLogin(email, password)
  }

  const handleQuickDemo = () => {
    setEmail('admin@example.com')
    setPassword('admin123')
    doLogin('admin@example.com', 'admin123')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-800 lg:flex lg:flex-col lg:justify-between lg:p-16 text-white">
        {/* Background glow circle */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">DocManager DMS</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Hệ thống Quản lý Tài liệu Doanh nghiệp
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Quản lý, số hóa và ký duyệt tài liệu tập trung.
          </h1>
          <p className="text-base text-primary-100 leading-relaxed">
            Hỗ trợ toàn diện vòng đời tài liệu: tải lên đa định dạng, phân loại thông minh, kiểm soát phiên bản toàn vẹn mã hóa SHA-256 và ký số điện tử.
          </p>

          <div className="space-y-3 pt-2 text-sm text-primary-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
              <span>Bảo vệ toàn vẹn tài liệu với mã băm SHA-256</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
              <span>Quản lý lịch sử đa phiên bản (v1, v2, v3...)</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
              <span>Xác thực và cấp chữ ký số điện tử theo chuẩn</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-200">
          © 2026 DocManager Enterprise DMS. Phiên bản Front-end độc lập.
        </div>
      </div>

      {/* Right panel – Login form */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocManager</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Đăng nhập hệ thống</h2>
          <p className="mt-2 text-sm text-gray-500">
            Chào mừng trở lại! Vui lòng nhập thông tin hoặc đăng nhập bằng tài khoản mẫu.
          </p>

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50/70 p-3 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-primary-600" />
            Đăng nhập nhanh 1-Click (Tài khoản Quản trị Demo)
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-gray-50 px-3 text-xs uppercase tracking-wider text-gray-400">
              Hoặc nhập tài khoản
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Địa chỉ Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-gray-100/80 p-3.5 text-center text-xs text-gray-500">
            Tài khoản demo: <span className="font-semibold text-gray-800">admin@example.com</span> / Mật khẩu:{' '}
            <span className="font-semibold text-gray-800">admin123</span>
          </div>
        </div>
      </div>
    </div>
  )
}
