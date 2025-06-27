import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
const MainPage = () => {
    useEffect(() => {
        // Если в адресе есть ?reset, сбрасываем onboardingCompleted
        if (window.location.search.includes("reset")) {
            localStorage.removeItem("onboardingCompleted");
            window.location.href = "/";
        }
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { children: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 Splitto" }), _jsxs("p", { children: ["\u0427\u0442\u043E\u0431\u044B \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433, \u043E\u0442\u043A\u0440\u043E\u0439 WebApp \u043F\u043E \u0430\u0434\u0440\u0435\u0441\u0443:", _jsx("br", {}), _jsx("b", { children: "https://splitto.app?reset" })] })] }));
};
export default MainPage;
