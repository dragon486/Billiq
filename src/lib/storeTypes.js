// Store module gating configurations

export const STORE_CONFIGS = {
  "Restaurant": {
    label: "Restaurant / Cafe",
    description: "Full table service, KDS, and waitlist features.",
    enabledModules: ["billing", "kitchen", "tables", "customers", "reports"]
  },
  "Retail": {
    label: "Grocery / Bakery",
    description: "Fast counter billing with inventory alerts.",
    enabledModules: ["billing", "inventory", "customers", "reports"]
  },
  "Medical": {
    label: "Medical / Pharmacy",
    description: "Prescription notes and compliance features.",
    enabledModules: ["billing", "prescriptions", "customers", "reports"]
  },
  "Service": {
    label: "Salon / Spa",
    description: "Appointment scheduling and service billing.",
    enabledModules: ["billing", "appointments", "customers", "reports"]
  }
};
