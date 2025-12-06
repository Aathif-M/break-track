import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import loginPlaceholder from '../assets/login_placeholder.png';
import metaLogoBlack from '../assets/meta-logo-black.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            if (user.role === 'AGENT') {
                navigate('/dashboard');
            } else {
                navigate('/manager');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login failed. Check console for details.');
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Form */}
            <div className="w-full md:w-2/5 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white">
                <div className="w-full max-w-md mx-auto">
                    <img
                        src={metaLogoBlack}
                        alt="Login Cover"
                        className="w-1/2"
                    />
                    <h2 className="text-4xl font-bold mb-12 text-gray-800">Work Pulse</h2>

                    {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
                                placeholder="Email"
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
                                placeholder="Password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition duration-200 font-medium"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden md:block md:w-3/5 bg-gray-50 h-screen">
                <img
                    src={loginPlaceholder}
                    alt="Login Cover"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
};

export default Login;
