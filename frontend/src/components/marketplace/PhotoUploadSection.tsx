import React from 'react'
import { Plus, X } from 'lucide-react'
import { Control, useFieldArray, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhotoUploadSectionProps {
    control: Control<any>
    register: UseFormRegister<any>
    errors?: any
}

export function PhotoUploadSection({ control, register, errors }: PhotoUploadSectionProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'images'
    })

    return (
        <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
                <h2 className="text-lg font-bold text-gray-900 inline-flex items-center">
                    <span className="text-[#4C3B8A] mr-1">3.</span> Add Photos
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    High quality photos help you get more responses. Upload at least one image.
                </p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                            {index === 0 && (
                                <Label className="text-[#4C3B8A] font-bold text-xs uppercase">
                                    Main Image URL
                                </Label>
                            )}
                            <div>
                                <Input
                                    {...register(`images.${index}.url`)}
                                    placeholder="https://image-hosting.com/my-photo.jpg"
                                    type="url"
                                    className={`bg-white ${errors?.images?.[index]?.url ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#4C3B8A]'}`}
                                />
                                {errors?.images?.[index]?.url && (
                                    <p className="text-xs text-red-500 mt-1 font-medium">
                                        {errors.images[index].url.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={index === 0 ? "pt-5" : ""}>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {fields.length < 8 && (
                    <button
                        type="button"
                        onClick={() => append({ url: '' })}
                        className="text-[#4C3B8A] font-bold text-sm hover:underline flex items-center gap-1 mt-2"
                    >
                        <Plus className="w-4 h-4" /> Add another photo
                    </button>
                )}
            </div>
            {errors?.images?.message && typeof errors.images.message === 'string' && (
                <p className="text-sm font-bold text-red-500">{errors.images.message}</p>
            )}
        </div>
    )
}
