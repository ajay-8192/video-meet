import { RouterProvider } from "react-router-dom"
import routes from "./routes"
import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./context/NotificationContext"

function App() {

  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={routes} />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
