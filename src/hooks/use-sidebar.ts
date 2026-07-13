import { useState } from "react"

const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed"

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
  )

  const toggle = () => {
    setIsCollapsed((collapsed) => {
      const nextCollapsed = !collapsed
      localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(nextCollapsed)
      )
      return nextCollapsed
    })
  }

  return { isCollapsed, toggle }
}
