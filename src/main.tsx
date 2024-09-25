import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "@/app/App"
import "@/app/app.global.css"
const rootElement = document.getElementById("root")
const root = createRoot(rootElement!)

root.render(
	<StrictMode>
		<App />
	</StrictMode>
)
