import { ArrowLeft, House } from "lucide-react"
import { Link, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <img
          src="/images/page-not-found.svg"
          alt="页面不存在"
          width="860"
          height="571"
          className="mb-8 h-52 w-full max-w-sm object-contain dark:brightness-125"
        />
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold">页面不存在</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          你访问的页面不存在，或相关内容已经被移除。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            返回上一页
          </Button>
          <Button asChild>
            <Link to="/">
              <House className="size-4" />
              回到首页
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
