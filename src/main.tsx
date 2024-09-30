import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/pages/caps/app.global.css"
import router from "./app/app.provider"
import { RouterProvider } from "react-router-dom"
const rootElement = document.getElementById("root")
const root = createRoot(rootElement!)

root.render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
)
