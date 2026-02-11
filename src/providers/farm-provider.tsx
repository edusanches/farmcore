"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Farm {
  id: string
  name: string
}

interface FarmMembership {
  id: string
  farmId: string
  role: string
  farm: Farm
}

interface FarmContextType {
  activeFarm: FarmMembership | null
  farms: FarmMembership[]
  setActiveFarm: (farm: FarmMembership) => void
}

const FarmContext = createContext<FarmContextType>({
  activeFarm: null,
  farms: [],
  setActiveFarm: () => {},
})

export function FarmProvider({
  children,
  initialFarms,
  initialActiveFarm,
}: {
  children: ReactNode
  initialFarms: FarmMembership[]
  initialActiveFarm: FarmMembership | null
}) {
  const [activeFarm, setActiveFarm] = useState<FarmMembership | null>(initialActiveFarm)
  const [farms] = useState<FarmMembership[]>(initialFarms)

  return (
    <FarmContext.Provider value={{ activeFarm, farms, setActiveFarm }}>
      {children}
    </FarmContext.Provider>
  )
}

export function useFarm() {
  const context = useContext(FarmContext)
  if (!context) throw new Error("useFarm must be used within FarmProvider")
  return context
}
