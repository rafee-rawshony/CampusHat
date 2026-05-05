export function normalizeListResponse<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[]

    if (payload && typeof payload === 'object') {
        const typedPayload = payload as Record<string, unknown>

        if (Array.isArray(typedPayload.results)) return typedPayload.results as T[]
        if (Array.isArray(typedPayload.data)) return typedPayload.data as T[]
        if (typedPayload.data && typeof typedPayload.data === 'object') {
            const nestedData = typedPayload.data as Record<string, unknown>
            if (Array.isArray(nestedData.results)) return nestedData.results as T[]
            if (Array.isArray(nestedData.items)) return nestedData.items as T[]
        }
        if (Array.isArray(typedPayload.items)) return typedPayload.items as T[]
    }

    return []
}

export function normalizeSingleResponse<T>(payload: unknown): T | null {
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') return null

    const typedPayload = payload as Record<string, unknown>
    if (typedPayload.data && typeof typedPayload.data === 'object' && !Array.isArray(typedPayload.data)) {
        return typedPayload.data as T
    }

    return payload as T
}
