import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaSpinner, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import AuthLayout from '../components/auth/AuthLayout';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await register(email, password); 
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create account.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            {/* ===== LOGO ===== */}
            <div className="flex flex-col items-center">
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
                    className="relative"
                >
                    <div 
                        className="absolute inset-[-8px] rounded-full pointer-events-none"
                        style={{
                            border: '1px solid rgba(139,92,246,0.25)',
                            boxShadow: '0 0 24px rgba(139,92,246,0.3), inset 0 0 16px rgba(236,72,153,0.15)',
                        }}
                    />
                    <div 
                        className="relative w-[64px] h-[64px] rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(20,22,35,0.9), rgba(30,25,50,0.9))',
                            border: '1.5px solid rgba(139,92,246,0.35)',
                            boxShadow: '0 0 30px rgba(139,92,246,0.25), inset 0 0 12px rgba(139,92,246,0.1)',
                        }}
                    >
                        <span className="text-[28px] leading-none">⚡</span>
                    </div>
                </motion.div>

                {/* ===== TITLE ===== */}
                <h1 
                    className="text-white text-center"
                    style={{ 
                        fontSize: '48px', 
                        fontWeight: 800, 
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        marginTop: '28px',
                    }}
                >
                    Create Account ✨
                </h1>

                <p 
                    style={{ 
                        fontSize: '18px', 
                        color: 'rgba(148,163,184,1)',
                        fontWeight: 500,
                        marginTop: '14px',
                    }}
                >
                    Join Finance X-Ray today
                </p>
            </div>

            {/* ===== FORM ===== */}
            <form onSubmit={handleSubmit}>
                {error && (
                    <div 
                        className="flex items-center justify-center text-red-400 font-medium"
                        style={{
                            marginTop: '24px',
                            padding: '14px 16px',
                            fontSize: '14px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: '14px',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* === NAME === */}
                <div style={{ marginTop: '36px' }}>
                    <label 
                        className="block text-[#e2e8f0]"
                        style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}
                    >
                        Full Name
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-[#64748b] group-focus-within:text-[#8B5CF6] transition-colors duration-300" style={{ paddingLeft: '18px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'rgba(20,22,35,0.55)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px',
                                paddingLeft: '52px',
                                paddingRight: '18px',
                                color: 'white',
                                fontSize: '17px',
                                outline: 'none',
                                transition: 'all 300ms ease',
                            }}
                            className="placeholder-white/35 focus:!border-[#8B5CF6] focus:shadow-[0_0_24px_rgba(139,92,246,0.25)]"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                {/* === EMAIL === */}
                <div style={{ marginTop: '24px' }}>
                    <label 
                        className="block text-[#e2e8f0]"
                        style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}
                    >
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-[#64748b] group-focus-within:text-[#8B5CF6] transition-colors duration-300" style={{ paddingLeft: '18px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/><polyline points="3 7 12 13 21 7"/></svg>
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'rgba(20,22,35,0.55)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px',
                                paddingLeft: '52px',
                                paddingRight: '18px',
                                color: 'white',
                                fontSize: '17px',
                                outline: 'none',
                                transition: 'all 300ms ease',
                            }}
                            className="placeholder-white/35 focus:!border-[#8B5CF6] focus:shadow-[0_0_24px_rgba(139,92,246,0.25)]"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                {/* === PASSWORD === */}
                <div style={{ marginTop: '24px' }}>
                    <label 
                        className="block text-[#e2e8f0]"
                        style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}
                    >
                        Password
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-[#64748b] group-focus-within:text-[#8B5CF6] transition-colors duration-300" style={{ paddingLeft: '18px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'rgba(20,22,35,0.55)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px',
                                paddingLeft: '52px',
                                paddingRight: '56px',
                                color: 'white',
                                fontSize: '17px',
                                outline: 'none',
                                transition: 'all 300ms ease',
                            }}
                            className="placeholder-white/35 focus:!border-[#8B5CF6] focus:shadow-[0_0_24px_rgba(139,92,246,0.25)]"
                            placeholder="Min 8 characters"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center text-[#64748b] hover:text-white transition-colors duration-300"
                            style={{ paddingRight: '18px' }}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* === SIGN UP BUTTON === */}
                <div style={{ marginTop: '32px' }}>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(247,37,133,0.35)] focus:outline-none"
                        style={{
                            height: '58px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #7B2FF7 0%, #F72585 100%)',
                            boxShadow: '0 15px 40px rgba(247,37,133,0.25)',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="animate-spin" size={18} />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Sign Up <FaArrowRight size={15} className="ml-1" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* === DIVIDER === */}
            <div className="relative flex items-center justify-center" style={{ marginTop: '32px' }}>
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div 
                    className="relative"
                    style={{ 
                        padding: '0 16px',
                        backgroundColor: 'rgba(20,22,35,0.72)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#64748b',
                    }}
                >
                    or continue with
                </div>
            </div>

            {/* === GOOGLE BUTTON === */}
            <button
                type="button"
                className="w-full flex items-center justify-center gap-3 transition-all duration-300 hover:bg-white/[0.05]"
                style={{
                    marginTop: '28px',
                    height: '56px',
                    borderRadius: '14px',
                    background: 'rgba(20,22,35,0.4)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
            </button>

            {/* === FOOTER === */}
            <div 
                className="text-center"
                style={{ 
                    marginTop: '32px', 
                    fontSize: '15px', 
                    fontWeight: 500,
                    color: '#94a3b8',
                }}
            >
                Already have an account?{' '}
                <Link 
                    to="/login" 
                    className="hover:text-[#f472b6] transition-colors duration-300"
                    style={{ color: '#ec4899', fontWeight: 600, marginLeft: '4px' }}
                >
                    Sign in
                </Link>
            </div>
        </AuthLayout>
    );
}
