import { useState } from 'react';
import { useNavigate, Link } from 'react-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5222/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userRole', data.role);
        
        // Regular customer login - always redirect to customer dashboard
        // Admin users should use the dedicated admin login page
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 transition active:scale-95">
          <span className="mr-2">←</span> Back to Home
        </Link>
        
        <div className="text-center mb-6 md:mb-8">
          <div className="text-4xl md:text-6xl mb-4">🔐</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Customer Login</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-base"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-base"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link to="/forgot-password" className="block text-blue-600 hover:text-blue-700 font-semibold active:scale-95">
            Forgot your password?
          </Link>
          
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register here
            </Link>
          </p>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-gray-500 text-xs mb-2">Admin Access</p>
            <Link to="/admin/login" className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
