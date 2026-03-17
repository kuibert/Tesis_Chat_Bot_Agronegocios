import * as startUp from "./start-up";

startUp.init().catch((reason) => {
  console.error(reason);
  process.exit(1)
});
