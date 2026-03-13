import { Link, useNavigate } from 'react-router';
import { useState } from 'react';

export default function CustomerNav({ userName, cartCount = 0 }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
    setShowMobileMenu(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white hover:text-blue-100 transition group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🛒</span>
            <span className="text-xl font-bold">ShopHub</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-blue-100 transition font-medium">
              Home
            </Link>
            <Link to="/wishlist" className="text-white hover:text-blue-100 transition font-medium flex items-center">
              <span className="mr-1">❤️</span> Wishlist
            </Link>
            <Link to="/cart" className="text-white hover:text-blue-100 transition font-medium relative">
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button & Cart */}
          <div className="flex items-center space-x-3 md:hidden">
            <Link to="/cart" className="text-white hover:text-blue-100 transition relative">
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-white hover:text-blue-100 transition p-2"
              aria-label="Toggle mobile menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${showMobileMenu ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:block relative">
            {userName ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-white hover:text-blue-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{userName}</span>
                  <span className="text-sm">▼</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 animate-fade-in">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-gray-800 hover:bg-blue-50 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-blue-50 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      👤 Profile
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition font-semibold"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-white hover:text-blue-100 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-700 rounded-b-lg">
              <Link
                to="/"
                className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium transition"
                onClick={closeMobileMenu}
              >
                🏠 Home
              </Link>
              <Link
                to="/wishlist"
                className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium transition"
                onClick={closeMobileMenu}
              >
                ❤️ Wishlist
              </Link>
              
              {userName ? (
                <>
                  <div className="border-t border-blue-600 my-2"></div>
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{userName}</span>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium transition"
                    onClick={closeMobileMenu}
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium transition"
                    onClick={closeMobileMenu}
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-300 hover:bg-red-600 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium transition"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-blue-600 my-2"></div>
                  <Link
                    to="/login"
                    className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium transition"
                    onClick={closeMobileMenu}
                  >
                    🔑 Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 hover:bg-blue-50 block px-3 py-2 rounded-md text-base font-semibold transition mx-3"
                    onClick={closeMobileMenu}
                  >
                    ✨ Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
