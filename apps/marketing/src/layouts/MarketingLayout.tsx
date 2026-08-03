import { Outlet } from "react-router-dom";

import { MarketingFooter } from "../components/navigation/MarketingFooter";
import { MarketingHeader } from "../components/navigation/MarketingHeader";

export function MarketingLayout() {
  return (
    <div className="marketing-app">
      <MarketingHeader />

      <main>
        <Outlet />
      </main>

      <MarketingFooter />
    </div>
  );
}
