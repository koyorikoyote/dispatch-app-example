import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface RefreshContextType {
    refreshTrigger: number
    triggerRefresh: () => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: ReactNode }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1)
    }, [])

    return (
        <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
            {children}
        </RefreshContext.Provider>
    )
}

export function useRefresh() {
    const context = useContext(RefreshContext)
    if (context === undefined) {
        throw new Error("useRefresh must be used within a RefreshProvider")
    }
    return context
}
