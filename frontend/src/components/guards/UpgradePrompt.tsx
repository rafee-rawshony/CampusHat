import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface UpgradePromptProps {
    message?: string
}

export function UpgradePrompt({
    message = 'This feature requires student/faculty verification',
}: UpgradePromptProps) {
    return (
        <Card className="max-w-md mx-auto my-8 animate-fade-in">
            <CardContent className="flex flex-col items-center text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-brand-primary" />
                </div>
                <h3 className="font-semibold text-lg">Verification Required</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button asChild>
                    <Link href="/account/verify">Verify Your Account</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
