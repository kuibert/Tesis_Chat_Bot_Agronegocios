import { BotMessageSquare, History, Plus } from "lucide-react";
import React from "react";

import { useAuth } from "@/hooks/useAuth";
import { useChats } from "@/hooks/useChats";

type SideProps = React.ComponentProps<"div">;
interface SideBarProps extends SideProps {}

export function SideBar({ ...props }: SideBarProps) {
  const { hasSession } = useAuth();
  const { data: chats = [], isLoading } = useChats();

  return (
    <div {...props}>
      <label
        htmlFor="my-drawer-4"
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>

      <div className="flex min-h-full flex-col bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64 transition-all duration-300">
        <div className="flex justify-center gap-2 items-center w-full mt-4">
          <BotMessageSquare className="my-1.5 " />
          <span className="is-drawer-close:hidden">AGRO CHAT</span>
        </div>

        <div className="px-2 mt-6">
          <button
            className="btn btn-primary w-full is-drawer-open:justify-start is-drawer-close:items-center is-drawer-close:pl-3 is-drawer-close:tooltip is-drawer-close:tooltip-right"
            data-tip="Nuevo chat"
            disabled={!hasSession}
          >
            <Plus className="my-1.5 inline-block size-4" />

            <span className="is-drawer-close:hidden transition-all">
              Nuevo chat
            </span>
          </button>
        </div>

        <div className="w-full  flex-1 overflow-y-auto overflow-x-hidden is-drawer-close:hidden">
          <div className="px-4 pt-8 pb-2 ">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
              <History className="size-3" /> Mis chats
            </h3>
          </div>

          {hasSession && (
            <ul className="menu w-full p-2 gap-1">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    className="flex items-center gap-3 is-drawer-close:tooltip is-drawer-close:tooltip-right"
                    data-tip={chat.title}
                  >
                    <span className="is-drawer-close:hidden text-sm truncate w-full text-left">
                      {chat.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
