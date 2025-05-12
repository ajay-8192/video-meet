import { useState } from "react";
import { useAuthService } from "../../services/authServices";

const LoginPage: React.FC = () => {

    const [email, setEmail] = useState("");

    const { loading, handleSendOTP } = useAuthService();

    const handleChange = (e: any) => {
        const value = e.target.value;
        setEmail(value);
    }

    const sendOTP = () => {
        handleSendOTP({ email });
        return
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>

                <div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            We'll send a one-time password to your email.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={sendOTP}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                        {loading ? 'Sending OTP...' : 'Get OTP'}
                    </button>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <a href="/register" className="text-blue-600 hover:underline">
                            Register
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
};

export default LoginPage;