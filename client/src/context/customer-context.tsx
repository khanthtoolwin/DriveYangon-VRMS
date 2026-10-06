import { createContext, useContext, useState, ReactNode } from "react";

export interface CustomerIdentity {
  name: string;
  email: string;
}

interface CustomerContextValue {
  customer: CustomerIdentity;
  setCustomer: (customer: CustomerIdentity) => void;
}

const DEFAULT_CUSTOMER: CustomerIdentity = {
  name: "Aung Ko Ko Min",
  email: "aungkokomin@example.com",
};

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerIdentity>(DEFAULT_CUSTOMER);
  return (
    <CustomerContext.Provider value={{ customer, setCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within a CustomerProvider");
  return ctx;
}
