import { MainLayout } from "@/components/main-layout";
import { useRecentPresets } from "@/hooks/use-preset";

export default function SquarePage() {
    return (
        <MainLayout>
            <div className="container py-6">
                <h1 className="text-3xl font-bold mb-6">广场</h1>
                <p>
                    这里是角色预设广场，您可以浏览和下载其他用户分享的角色预设。
                </p>
                {/* 这里可以添加更多的广场内容，比如热门预设列表、分类浏览等 */}
            </div>
        </MainLayout>
    );
}
