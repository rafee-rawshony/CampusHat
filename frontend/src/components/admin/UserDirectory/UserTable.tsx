import React from 'react'
import {
    MoreVertical, Ban
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { getRolePillData, getStatusPillJSX, formatDate } from './UserCard'

interface UserTableProps {
    users: any[]
    onViewProfile: (u: any) => void
    onChangeRole: (u: any) => void
    onSuspend: (u: any) => void
    onActivate: (u: any) => void
}

export function UserTable({ users, onViewProfile, onChangeRole, onSuspend, onActivate }: UserTableProps) {
    
    return (
        <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[220px]">USER</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[180px]">UNIVERSITY</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[160px]">ROLE</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[140px]">STATUS</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[120px]">JOINED</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[80px] text-right">ACTIONS</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {users.map((user) => {
                        const roleData = getRolePillData(user.role)

                        return (
                            <tr 
                                key={user.id} 
                                className="hover:bg-gray-50/50 transition cursor-pointer group"
                                onClick={() => onViewProfile(user)}
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-9 h-9 rounded-full border border-gray-100 shrink-0">
                                            <AvatarImage src={user.profile_picture} />
                                            <AvatarFallback className="bg-brand-primary text-white text-xs font-semibold tracking-wider">
                                                {getInitials(user.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 pr-2">
                                            <p className="font-semibold text-gray-900 text-sm truncate leading-tight group-hover:text-[#4C3B8A] transition-colors">{user.full_name}</p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-4 py-4 align-top">
                                    {user.university ? (
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                {user.university.short_name || 'UNI'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                                                {user.university.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 font-bold">—</span>
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider inline-block ${roleData.bg}`}>
                                        {roleData.label}
                                    </span>
                                </td>

                                <td className="px-4 py-4">
                                    {getStatusPillJSX(user)}
                                </td>

                                <td className="px-4 py-4">
                                    <span className="text-sm text-gray-500 font-medium">
                                        {formatDate(user.date_joined)}
                                    </span>
                                </td>

                                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100 p-1">
                                            <DropdownMenuItem onClick={() => onViewProfile(user)} className="rounded-lg cursor-pointer">View Profile</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onChangeRole(user)} className="rounded-lg cursor-pointer">Change Role</DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-50 my-1" />
                                            {user.is_active ? (
                                                <DropdownMenuItem 
                                                    onClick={() => onSuspend(user)} 
                                                    className="text-red-600 focus:text-red-700 bg-transparent hover:bg-red-50 focus:bg-red-50 rounded-lg cursor-pointer font-medium"
                                                >
                                                    Suspend User
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem 
                                                    onClick={() => onActivate(user)} 
                                                    className="text-green-600 focus:text-green-700 bg-transparent hover:bg-green-50 focus:bg-green-50 rounded-lg cursor-pointer font-medium"
                                                >
                                                    Activate User
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
