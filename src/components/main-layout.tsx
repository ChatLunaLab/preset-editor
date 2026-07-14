"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Users,
    FolderOpen,
    Menu,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SettingsDialog } from "./settings-dialog";
import { useRecentPresets } from "@/hooks/use-preset";
import { useSidebar } from "@/hooks/use-sidebar";
import { Toaster } from "./ui/sonner";
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { getRememberedCharacterPath } from "@/lib/editor-route";

function Sidebar({
    recentPresets,
    collapsed = false,
    onToggle,
}: {
    recentPresets: ReturnType<typeof useRecentPresets>;
    collapsed?: boolean;
    onToggle?: () => void;
}) {
    return (
        <div className="flex flex-col h-full">
            <div
                className={cn(
                    "flex h-16 shrink-0 items-center gap-2 px-4",
                    collapsed ? "justify-center px-2" : "justify-between"
                )}
            >
                <span className={cn("truncate font-medium", collapsed && "sr-only")}>
                    ChatLuna 预设站
                </span>
                {onToggle && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0"
                        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
                        title={collapsed ? "展开侧边栏" : "收起侧边栏"}
                        onClick={onToggle}
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="size-5" />
                        ) : (
                            <PanelLeftClose className="size-5" />
                        )}
                    </Button>
                )}
            </div>

            <div className="flex flex-col flex-1 overflow-auto px-2 gap-y-2">
                <NavItem href="/" icon={FolderOpen} label="项目" compact={collapsed} />
                <NavItem href="/square" icon={Users} label="广场" compact={collapsed} />

                {!collapsed && recentPresets.length > 0 && (
                    <div className="py-2">
                        <div className="px-2 py-2">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                最近编辑
                            </h2>
                        </div>
                        <nav className="space-y-4 gap-y-2 flex-col ">
                            {recentPresets.map((preset) => (
                                <NavItem
                                    key={preset.id}
                                    href={() =>
                                        getRememberedCharacterPath(
                                            preset.id,
                                            preset.type,
                                        )
                                    }
                                    label={preset.name}
                                />
                            ))}
                        </nav>
                        <Link
                            to="/"
                            className="block px-2 py-2 text-xs text-muted-foreground hover:text-primary"
                        >
                            查看全部 <ChevronRight className="inline h-3 w-3" />
                        </Link>
                    </div>
                )}
            </div>

            <SettingsDialog compact={collapsed} />
        </div>
    );
}

export function MainLayout() {
    const [isOpen, setIsOpen] = React.useState(false);
    const { isCollapsed: isSidebarCollapsed, toggle: toggleSidebar } = useSidebar();
    const recentPresets = useRecentPresets();

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden h-screen shrink-0 border-r bg-card/50 transition-[width] duration-300 ease-in-out md:block",
                    isSidebarCollapsed ? "w-16" : "w-64"
                )}
            >
                <Sidebar
                    recentPresets={recentPresets}
                    collapsed={isSidebarCollapsed}
                    onToggle={toggleSidebar}
                />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden absolute top-3 left-3"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <Sidebar recentPresets={recentPresets} />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div
                className="flex-1 w-full h-screen scroll-smooth overflow-auto"
                data-main-scroll-container
            >
                <div className="md:hidden h-16 border-b" />{" "}
                {/* Mobile header spacing */}
                <Outlet />
            </div>
            <Toaster />
        </div>
    );
}

interface NavItemProps {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    href: string | (() => string);
    compact?: boolean;
}

function NavItem({ icon: Icon, label, href, compact = false }: NavItemProps) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const resolvedHref = typeof href === "function" ? href() : href;
  
    const isActive =
        pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (typeof href !== "function") return;
        if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();
        navigate(href());
    };

    return (
        <Link
            to={resolvedHref}
            title={compact ? label : undefined}
            onClick={handleClick}
        >
            <Button
                variant="ghost"
                aria-label={compact ? label : undefined}
                className={cn(
                    "w-full justify-start gap-3 px-4 mt-0 h-10 rounded-lg",
                    compact && "justify-center gap-0 px-0",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
            >
                {Icon && <Icon className="size-5 shrink-0" />}
                <span className={cn(compact && "sr-only")}>{label}</span>
            </Button>
        </Link>
    );
}
