const fs = require('fs');
const file = 'frontend/src/components/admin/ReviewCenter/VerificationReviewTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /import { ApproveConfirmDialog } from '\.\/ApproveConfirmDialog'/,
    "import { ApproveConfirmDialog } from './ApproveConfirmDialog'\nimport { VerificationDetailsModal } from './VerificationDetailsModal'"
);

content = content.replace(
    /const \[approveItem, setApproveItem\] = useState<any \| null>\(null\)/,
    "const [approveItem, setApproveItem] = useState<any | null>(null)\n    const [detailsItem, setDetailsItem] = useState<any | null>(null)"
);

content = content.replace(
    /                                <div className="mt-4 flex gap-2">/,
    `                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <div />
                                        <button 
                                            onClick={() => setDetailsItem(item)}
                                            className="text-xs font-bold text-[#4C3B8A] hover:underline"
                                        >
                                            View Full Details →
                                        </button>
                                    </div>
                                    <div className="flex gap-2">`
);

content = content.replace(
    /<\/>\r?\n    \)\r?\n}/,
    `            <VerificationDetailsModal
                isOpen={!!detailsItem}
                onClose={() => setDetailsItem(null)}
                verification={detailsItem}
            />
        </>
    )
}`
);

fs.writeFileSync(file, content);
console.log('File updated successfully.');
