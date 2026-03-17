import { Router } from "express";

const routes = Router();
const PATH = "/api";

routes.get(`${PATH}/health`, (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Successfully",
  });
});

export { routes, PATH };
