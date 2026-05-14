import { createApp } from "./app.js";
import { createServices } from "./services.js";

const services = await createServices();
const app = createApp(services).listen(3000);

console.log(
	`Backend listening on http://localhost:${app.server?.port ?? 3000}`,
);
