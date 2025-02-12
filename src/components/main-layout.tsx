"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Users,
    FolderOpen,
    Menu,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SettingsDialog } from "./settings-dialog";
import { useRecentPresets } from "@/hooks/use-preset";
import { Toaster } from "./ui/toaster";
import { Link, useLocation } from 'react-router';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const recentPresets = useRecentPresets();

    const Sidebar = () => (
        <div className="flex flex-col h-full">
            <div className="flex h-16 items-center px-4">
                ChatLuna 预设编辑器
            </div>

            <div className="flex flex-col flex-1 overflow-auto px-2 gap-y-2">
                <NavItem href="/" icon={FolderOpen} label="项目" />
                <NavItem href="/square" icon={Users} label="广场" />

                {recentPresets.length > 0 && (
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
                                    href={`/character/${preset.id}`}
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

            <SettingsDialog />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:block md:w-64 border-r bg-card/50">
                <Sidebar />
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
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 w-full">
                <div className="md:hidden h-16 border-b" />{" "}
                {/* Mobile header spacing */}
                {children}
            </div>
            <Toaster />
        </div>
    );
}

interface NavItemProps {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
}

function NavItem({ icon: Icon, label, href }: NavItemProps) {
    const { pathname } = useLocation();
  
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link to={href}>
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start gap-3 px-4 mt-0 h-10 rounded-lg",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
            >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{label}</span>
            </Button>
        </Link>
    );
}
