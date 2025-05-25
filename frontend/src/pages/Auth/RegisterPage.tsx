import { useState } from "react";
import { useAuthService } from "../../services/authServices";

const RegisterPage: React.FC = () => {

    const { loading, handleRegister } = useAuthService();
    const [registerDetails, setRegsiterDetails] = useState({
        firstname: "",
        lastname: "",
        username: "",
        email: "",
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setRegsiterDetails({
            ...registerDetails,
            [name]: value
        });
    };

    const handleRegisterUser = (e: any) => {
        e.preventDefault();

        handleRegister(registerDetails);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Your Account</h2>

                <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="firstName">First Name</label>
                            <input
                                id="firstname"
                                name="firstname"
                                type="text"
                                value={registerDetails.firstname}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="lastName">Last Name</label>
                            <input
                                id="lastname"
                                name="lastname"
                                type="text"
                                value={registerDetails.lastname}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={registerDetails.username}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={registerDetails.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRegisterUser}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                        {loading ? 'Processing...' : 'Register'}
                    </button>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-600 hover:underline">
                            Log in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
};

export default RegisterPage;