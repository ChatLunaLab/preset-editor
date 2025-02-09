"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    ArrowUp,
    MoreVerticalIcon,
    Pencil,
    Trash2,
    Download,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { deletePreset, PresetModel } from "@/hooks/usePreset";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CharacterListProps {
    presets: PresetModel[];
    searchQuery: string;
}

type SortKey = "name" | "type" | "lastModified";

export function CharacterList({
    presets: initialCharacters,
    searchQuery,
}: CharacterListProps) {
    const [characters, setCharacters] = useState([] as PresetModel[]);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [openAlert, setOpenAlert] = useState(false);
    const [selectedCharacterId, setSelectedCharacterId] = useState<
        string | null
    >(null);
    const router = useRouter();

    const sortCharacters = (key: SortKey) => {
        const newSortOrder =
            key === sortKey && sortOrder === "asc" ? "desc" : "asc";
        setSortKey(key);
        setSortOrder(newSortOrder);

        const sortedCharacters = [...characters].sort((a, b) => {
            if (a[key] < b[key]) return sortOrder === "asc" ? -1 : 1;
            if (a[key] > b[key]) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setCharacters(sortedCharacters);
    };

    useEffect(() => {
        const filteredCharacters = initialCharacters.filter((character) =>
            character.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setCharacters(filteredCharacters);
    }, [initialCharacters, searchQuery]);

    if (initialCharacters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full">
                <Image
                    width="100"
                    height="100"
                    src="/images/empty-state.svg"
                    alt="No presets"
                    className="w-48 h-48 mb-4"
                />
                <div className="text-2xl font-bold tracking-tight">
                    没有预设
                </div>
                <div className="text-base text-muted-foreground text-center pt-4">
                    点击右上角的按钮新建或者导入预设
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30%]">
                            <Button
                                variant="ghost"
                                onClick={() => sortCharacters("name")}
                                className={`hover:bg-transparent transition-all ${
                                    sortKey === "name" ? "text-primary" : ""
                                }`}
                            >
                                名称
                                {sortKey === "name" ? (
                                    <ArrowUp
                                        className={`ml-2 h-4 w-4 transition-transform duration-200  ${
                                            sortOrder === "asc"
                                                ? ""
                                                : "rotate-180"
                                        }`}
                                    />
                                ) : (
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                )}
                            </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            <Button
                                variant="ghost"
                                onClick={() => sortCharacters("type")}
                                className={`hover:bg-transparent transition-all ${
                                    sortKey === "type" ? "text-primary" : ""
                                }`}
                            >
                                类型
                                {sortKey === "type" ? (
                                    <ArrowUp
                                        className={`ml-2 h-4 w-4 transition-transform duration-200  ${
                                            sortOrder === "asc"
                                                ? ""
                                                : "rotate-180"
                                        }`}
                                    />
                                ) : (
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                )}
                            </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            <Button
                                variant="ghost"
                                onClick={() => sortCharacters("lastModified")}
                                className={`hover:bg-transparent transition-all ${
                                    sortKey === "lastModified"
                                        ? "text-primary"
                                        : ""
                                }`}
                            >
                                最后修改
                                {sortKey === "lastModified" ? (
                                    <ArrowUp
                                        className={`ml-2 h-4 w-4 transition-transform duration-200  ${
                                            sortOrder === "asc"
                                                ? ""
                                                : "rotate-180"
                                        }`}
                                    />
                                ) : (
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                )}
                            </Button>
                        </TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {characters.map((character) => (
                        <TableRow key={character.id}>
                            <TableCell>
                                <Link
                                    href={`/character/${character.id}`}
                                    className="font-medium hover:text-primary ml-4"
                                >
                                    {character.name}
                                </Link>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <span className="ml-4">{character.type}</span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell ml-4">
                                <span className="ml-4">
                                    {new Date(
                                        character.lastModified
                                    ).toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex space-x-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVerticalIcon className="h-4 w-4" />
                                                <span className="sr-only">
                                                    更多操作
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    router.push(
                                                        `/character/${character.id}`
                                                    );
                                                }}
                                            >
                                                编辑
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                导出
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedCharacterId(
                                                        character.id
                                                    );
                                                    setOpenAlert(true);
                                                }}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            >
                                                删除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销. 你确定要删除这个预设吗?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setSelectedCharacterId(null);
                            }}
                        >
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                await deletePreset(selectedCharacterId!);
                                setOpenAlert(false);
                                setSelectedCharacterId(null);
                            }}
                        >
                            确认
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
