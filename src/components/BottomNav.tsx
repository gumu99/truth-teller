import { Link, useLocation } from "react-router-dom";
import { Search, LayoutList, Clock } from "lucide-react";

const navItems = [
  { path: "/", label: "Investigate", icon: Search },
  { path: "/queue", label: "Queue", icon: LayoutList },
  { path: "/history", label: "History", icon: Clock },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[640px] items-center justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-standard rounded-md ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
