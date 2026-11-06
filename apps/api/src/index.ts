import { createApp } from "./app";
import { config } from "./config";

createApp().listen(config.port, () => {
  console.log(`RevestIA API → http://localhost:${config.port}/api`);
});
