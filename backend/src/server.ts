import express from "express";
import cors from "cors";

import { routes } from "./routes/api.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use(routes);

export const listen = ({
  port,
  host,
}: {
  port: number;
  host: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    app.listen(port, host, () => {
      console.log(`Server running in: ${host}:${port}`);
      resolve();
    });
  });
};
