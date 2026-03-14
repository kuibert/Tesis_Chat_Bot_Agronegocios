import { BrowserRouter } from "react-router";
import { MainNavigation } from "./navigations";

import { AppProvider } from "./provider";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <MainNavigation />
      </AppProvider>
    </BrowserRouter>
  );
}
