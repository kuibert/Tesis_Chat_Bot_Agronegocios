import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";

import { routes, PATH } from "./routes/api.routes";
import { errorHandler } from "./handlers";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(`${PATH}`, routes);

app.use(errorHandler);

const listen = ({
  port,
  host,
}: {
  port: number;
  host: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    httpServer.listen(port, host, () => {
      console.log(`Server running in: http://${host}:${port}`);
      resolve();
    });
  });
};

export { httpServer, listen };
