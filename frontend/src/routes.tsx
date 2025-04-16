import { createBrowserRouter } from "react-router-dom";

// Auth Components
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import VerifyAccount from "./pages/Auth/VerifyAccount";
import VerifyOTP from "./pages/Auth/VerifyOTP";
import RoomList from "./pages/Room/RoomList";
import RoomDetailPage from "./pages/Room/RoomDetail";
import AuthRoot from "./pages/Auth/AuthRoot";
import CreateRoom from "./pages/Room/CreateRoom";

const routes = createBrowserRouter([
    {
        path: "",
        children: [
            {
                path: "/register",
                Component: Register
            },
            {
                path: "/login",
                Component: Login
            },
            {
                path: "/verify-account",
                Component: VerifyAccount
            },
            {
                path: "/verify-otp",
                Component: VerifyOTP
            },
            {
                path: "/",
                Component: AuthRoot,
                children: [
                    {
                        path: "dashboard?",
                        Component: RoomList
                    },
                    {
                        path: "rooms",
                        Component: RoomList
                    },
                    {
                        path: "rooms/create",
                        Component: CreateRoom
                    },
                    {
                        path: "room/:roomId",
                        Component: RoomDetailPage
                    }
                ]
            },
        ]
    },
    {
        path: "*",
        element: <center>Page Not Found</center>
    }
]);

export default routes;
