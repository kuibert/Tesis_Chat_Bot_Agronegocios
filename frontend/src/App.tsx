import { BrowserRouter } from "react-router";
import { MainNavigation } from "./navigations";

export default function App() {
  return (
    <BrowserRouter>
      <MainNavigation />
    </BrowserRouter>
  );
}
