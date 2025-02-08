"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface Character {
  id: string
  name: string
  type: string
  lastModified: string
}

interface CharacterListProps {
  characters: Character[]
}

type SortKey = "name" | "type" | "lastModified"

export function CharacterList({ characters: initialCharacters }: CharacterListProps) {
  const [characters, setCharacters] = useState(initialCharacters)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const sortCharacters = (key: SortKey) => {
    const newSortOrder = key === sortKey && sortOrder === "asc" ? "desc" : "asc"
    setSortKey(key)
    setSortOrder(newSortOrder)

    const sortedCharacters = [...characters].sort((a, b) => {
      if (a[key] < b[key]) return sortOrder === "asc" ? -1 : 1
      if (a[key] > b[key]) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setCharacters(sortedCharacters)
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
              <Button variant="ghost" onClick={() => sortCharacters("name")} className="hover:bg-transparent">
                名称
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button variant="ghost" onClick={() => sortCharacters("type")} className="hover:bg-transparent">
                类型
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button variant="ghost" onClick={() => sortCharacters("lastModified")} className="hover:bg-transparent">
                最后修改
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.map((character) => (
            <TableRow key={character.id}>
              <TableCell>
                <Link href={`/character/${character.id}`} className="font-medium hover:text-primary">
                  {character.name}
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">{character.type}</TableCell>
              <TableCell className="hidden md:table-cell">{character.lastModified}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/character/${character.id}`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">编辑</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">更多操作</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

