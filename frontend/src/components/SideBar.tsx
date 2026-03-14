import { BotMessageSquare } from "lucide-react";
import React from "react";

type SideProps = React.ComponentProps<"div">;

interface SideBarProps extends SideProps {}

export function SideBar({ ...props }: SideBarProps) {
  return (
    <div {...props}>
      <label
        htmlFor="my-drawer-4"
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
        {/* Sidebar content here */}
        <ul className="menu w-full grow">
          <li>
            <button
              className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
              data-tip="Nuevo chat"
            >
              <BotMessageSquare className="my-1.5 inline-block size-4" />
              <span className="is-drawer-close:hidden">Nuevo chat</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
