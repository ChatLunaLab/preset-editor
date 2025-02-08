import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface CharacterCardProps {
  name: string
  image: string
}

export function CharacterCard({ name, image }: CharacterCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
        </div>
        <div className="p-4">
          <h3 className="text-center font-medium">{name}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

