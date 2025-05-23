import { createBrowserRouter, Outlet } from "react-router-dom";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import VerifyAccountPage from "./pages/Auth/VerifyAccountPage";
import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
// import AuthRoot from "./pages/AuthRoot";
import RoomListPage from "./pages/Room/RoomListPage";
import RoomCreatePage from "./pages/Room/RoomCreatePage";
import RoomRoot from "./pages/RoomRoot";
import RoomChatPage from "./pages/Room/RoomChat";
import { ChatProvider } from "./context/ChatContext";

const routes = createBrowserRouter([
    {
        path: "login",
        Component: LoginPage
    },
    {
        path: "register",
        Component: RegisterPage
    },
    {
        path: "verify-account",
        Component: VerifyAccountPage
    },
    {
        path: "verify-otp",
        Component: VerifyOTPPage
    },
    // Room Routes
    {
        path: "",
        Component: RoomRoot,
        children: [
            {
                path: "room/create",
                Component: RoomCreatePage
            },
            {
                path: "room/list",
                Component: RoomListPage
            },
            {
                path: "",
                element: (
                    <ChatProvider>
                        <Outlet />
                    </ChatProvider>
                ),
                children: [
                    {
                        path: "room/:roomId",
                        Component: RoomChatPage
                    }
                ]
            }
        ]
    }
]);

export default routes;
