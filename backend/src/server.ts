import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { routes, PATH } from "./routes/api.routes";
import { errorHandler } from "./handlers";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(`${PATH}`, routes);

app.use(errorHandler);

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
