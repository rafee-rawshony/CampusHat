// Categories layout — passes through to page-level layout.
// Each page (/categories and /categories/[slug]) manages its own layout independently.
export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
