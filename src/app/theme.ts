import type { GlobalThemeOverrides } from 'naive-ui'

export const brand = '#22c55e'
export const brandDark = '#16a34a'

/** Personalización del tema oscuro de Naive UI con acento verde (marca tienda). */
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: brand,
    primaryColorHover: '#4ade80',
    primaryColorPressed: brandDark,
    primaryColorSuppl: brand,
    borderRadius: '10px',
    bodyColor: '#111827',
    cardColor: '#1f2937',
    modalColor: '#1f2937',
    popoverColor: '#1f2937',
    tableColor: '#111827',
    inputColor: '#111827',
    infoColor: '#38bdf8',
    successColor: brand
  },
  Card: {
    color: '#1f2937',
    borderColor: '#374151'
  },
  DataTable: {
    thColor: '#1e293b',
    tdColor: '#111827'
  },
  Layout: {
    siderColor: '#0b1220',
    headerColor: '#0b1220',
    color: '#111827'
  },
  Menu: {
    itemColorActive: brandDark,
    itemColorActiveHover: brandDark,
    itemTextColorActiveHover: '#fff'
  }
}