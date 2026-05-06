import sys

file_path = 'frontend/src/components/admin/ReviewCenter/VerificationReviewTab.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { ApproveConfirmDialog } from './ApproveConfirmDialog'",
    "import { ApproveConfirmDialog } from './ApproveConfirmDialog'\nimport { VerificationDetailsModal } from './VerificationDetailsModal'"
)

content = content.replace(
    "const [approveItem, setApproveItem] = useState<any | null>(null)",
    "const [approveItem, setApproveItem] = useState<any | null>(null)\n    const [detailsItem, setDetailsItem] = useState<any | null>(null)"
)

# Replace the specific div with the new button
old_div = """                                <div className="mt-4 flex gap-2">"""
new_div = """                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <div />
                                        <button 
                                            onClick={() => setDetailsItem(item)}
                                            className="text-xs font-bold text-[#4C3B8A] hover:underline"
                                        >
                                            View Full Details →
                                        </button>
                                    </div>
                                    <div className="flex gap-2">"""

content = content.replace(old_div, new_div)

# Add modal at the end
content = content.replace(
    "</>\n    )\n}",
    """            <VerificationDetailsModal
                isOpen={!!detailsItem}
                onClose={() => setDetailsItem(null)}
                verification={detailsItem}
            />
        </>
    )
}"""
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully.")
