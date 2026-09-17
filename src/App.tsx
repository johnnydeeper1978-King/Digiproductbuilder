import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/router";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
