import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthService } from "../../services/authServices";

const VerifyOTPPage: React.FC = () => {

    const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
    const [timer, setTimer] = useState<number>(300);

    const { loading, handleVerifyOTP: verifyOTP, handleSendOTP } = useAuthService();

    const { search } = useLocation();
    const query = new URLSearchParams(search);
    const email = query.get("email") || "";

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOtpChange = (index: number, value: string) => {
        if (/^[0-9]$/.test(value) || value === '') {
            const newOtpValues = [...otpValues];
            newOtpValues[index] = value;
            setOtpValues(newOtpValues);
            
            if (value !== '' && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();
        
        if (/^\d+$/.test(pastedData) && pastedData.length <= 6) {
            const digits = pastedData.split('').slice(0, 6);
            const newOtpValues = [...otpValues];
            
            digits.forEach((digit: string, index: number) => {
                if (index < 6) {
                    newOtpValues[index] = digit;
                }
            });
            
            setOtpValues(newOtpValues);
            
            const nextEmptyIndex = newOtpValues.findIndex(val => val === '');
            if (nextEmptyIndex !== -1) {
                inputRefs.current[nextEmptyIndex]?.focus();
            } else {
                inputRefs.current[5]?.focus();
            }
        }
    };

    const handleVerifyOTP = async () => {
        const otp = otpValues.join('');
        if (otp.length === 6) {
            verifyOTP({ email, otp });
        }
    };

    const handleResendOtp = async () => {
        if (timer === 0) {
            handleSendOTP({ email })
            setTimer(300);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2 text-center">Verify OTP</h2>
                <p className="text-gray-600 text-center mb-6">
                    Enter the 6-digit code sent to {email}
                </p>

                <div>
                    <div className="flex justify-between mb-6">
                        {otpValues.map((value, index) => (
                            <input
                                key={index}
                                ref={el => {
                                    if (el) inputRefs.current[index] = el;
                                }}
                                type="text"
                                maxLength={1}
                                value={value}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-12 h-12 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                required
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    <div className="text-center mb-4">
                        <p className={`text-sm ${timer === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {timer > 0 ? (
                                <>Code expires in {formatTime(timer)}</>
                            ) : (
                                <>Code expired. Please request a new one.</>
                            )}
                        </p>
                    </div>

                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || timer === 0 || otpValues.join('').length !== 6}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300"
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                </div>
                <div className="mt-6 text-center">
                    <button
                        onClick={handleResendOtp}
                        disabled={loading || timer > 0}
                        className="text-blue-600 hover:underline disabled:text-gray-400"
                    >
                        Resend OTP
                    </button>
                </div>
            </div>
        </div>
    )
};

export default VerifyOTPPage;