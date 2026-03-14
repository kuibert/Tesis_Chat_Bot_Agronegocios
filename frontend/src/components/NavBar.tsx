import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

type NavProps = React.ComponentProps<"nav">;

interface NavBarProps extends NavProps {
  isOpen?: boolean;
}

export function NavBar({ isOpen, ...props }: NavBarProps) {
  return (
    <nav {...props}>
      <label
        htmlFor="my-drawer-4"
        aria-label="open sidebar"
        className="btn btn-square btn-ghost "
      >
        {isOpen ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </label>

      <div className="px-4">Navbar Title</div>
    </nav>
  );
}
