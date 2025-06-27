import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import Onboarding from "../components/onboarding/Onboarding";
const OnboardingPage = () => {
    const navigate = useNavigate();
    const handleFinish = () => {
        localStorage.setItem("onboardingCompleted", "1");
        navigate("/main", { replace: true });
    };
    const handleSkip = () => {
        localStorage.setItem("onboardingCompleted", "0");
        navigate("/main", { replace: true });
    };
    return _jsx(Onboarding, { onFinish: handleFinish, onSkip: handleSkip });
};
export default OnboardingPage;
