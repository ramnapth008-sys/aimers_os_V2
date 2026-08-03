import { AuthProvider } from "@aimers/auth";

import { MarketingRouter } from "./router/MarketingRouter";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api/v1";

export function App() {
  return (
    <AuthProvider apiUrl={API_URL}>
      <MarketingRouter />
    </AuthProvider>
  );
}
