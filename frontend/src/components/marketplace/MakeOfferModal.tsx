import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface OfferModalProps {
    isOpen: boolean
    onClose: () => void
    listingId: string | number
    listingTitle: string
    askingPrice: string | number
}

export function MakeOfferModal({ isOpen, onClose, listingId, listingTitle, askingPrice }: OfferModalProps) {
    const [offerPrice, setOfferPrice] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!offerPrice) return

        setIsSubmitting(true)
        try {
            await api.post(`/marketplace/listings/${listingId}/offers/`, {
                amount: parseFloat(offerPrice),
                message: message.trim()
            })
            toast.success(`Your offer of ৳${offerPrice} has been sent to the seller.`)
            onClose()
            setOfferPrice('')
            setMessage('')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send offer. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Make an Offer</DialogTitle>
                        <DialogDescription>
                            Propose a new price for <span className="font-semibold text-gray-900">{listingTitle}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Asking Price</span>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">৳{Number(askingPrice).toLocaleString()}</span>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="offerPrice">Your Offer (৳)</Label>
                            <Input
                                id="offerPrice"
                                type="number"
                                required
                                min="1"
                                placeholder="e.g. 500"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                                className="text-lg font-semibold"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea
                                id="message"
                                placeholder="Add a friendly note with your offer..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !offerPrice} className="bg-brand-primary hover:bg-brand-dark text-white">
                            {isSubmitting ? 'Sending...' : 'Send Offer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
