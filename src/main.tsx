import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
	navigator.serviceWorker.getRegistrations().then((registrations) => {
		registrations.forEach((registration) => {
			registration.unregister();
		});
	});

	if ("caches" in window) {
		caches.keys().then((cacheNames) => {
			cacheNames.forEach((cacheName) => {
				if (cacheName.includes("workbox") || cacheName.includes("precache")) {
					caches.delete(cacheName);
				}
			});
		});
	}
}

createRoot(document.getElementById("root")!).render(<App />);
