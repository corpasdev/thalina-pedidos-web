import type { GlobalThemeOverrides } from 'naive-ui'

/** Paleta de marca: dorado, verde esmeralda y crema. */
export const gold = '#FFD700'
export const green = '#00A86B'
export const cream = '#F5F5DC'

export const brand = green
export const brandDark = '#008A59'

/** Personalización del tema oscuro de Naive UI con acento verde esmeralda (marca tienda). */
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: green,
    primaryColorHover: '#2ED5A0',
    primaryColorPressed: brandDark,
    primaryColorSuppl: brand,
    infoColor: '#58C0E8',
    successColor: green,
    warningColor: gold,
    errorColor: '#F87171',
    borderRadius: '10px',
    bodyColor: '#111827',
    cardColor: '#1f2937',
    modalColor: '#1f2937',
    popoverColor: '#1f2937',
    tableColor: '#111827',
    inputColor: '#111827',
    textColorBase: cream,
    textColor1: cream,
    textColor2: '#E5E7EB',
    textColor3: '#9CA3AF'
  },
  Card: {
    color: '#1f2937',
    borderColor: '#374151'
  },
  DataTable: {
    thColor: '#1e293b',
    tdColor: '#111827',
    thTextColor: cream,
    tdTextColor: '#E5E7EB'
  },
  Layout: {
    siderColor: '#0b1220',
    headerColor: '#0b1220',
    color: '#111827'
  },
  Menu: {
    itemColorActive: green,
    itemColorActiveHover: green,
    itemTextColorActiveHover: cream,
    itemTextColor: '#D1D5DB',
    itemTextColorActive: cream
  },
  PageHeader: {
    titleTextColor: cream
  }
}

/** Variante clara de la misma paleta (fondo crema) para modo 'light' / 'system'. */
export const themeOverridesLight: GlobalThemeOverrides = {
  common: {
    primaryColor: green,
    primaryColorHover: '#0A915C',
    primaryColorPressed: brandDark,
    primaryColorSuppl: brand,
    infoColor: '#0284C7',
    successColor: green,
    warningColor: gold,
    errorColor: '#DC2626',
    borderRadius: '10px',
    bodyColor: cream,
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableColor: '#ffffff',
    inputColor: '#ffffff',
    textColorBase: '#1f2937',
    textColor1: '#111827',
    textColor2: '#374151',
    textColor3: '#6b7280'
  },
  Card: {
    color: '#ffffff',
    borderColor: '#e5e7eb'
  },
  DataTable: {
    thColor: cream,
    tdColor: '#ffffff',
    thTextColor: '#111827',
    tdTextColor: '#1f2937'
  },
  Layout: {
    siderColor: '#ffffff',
    headerColor: '#ffffff',
    color: cream
  },
  Menu: {
    itemColorActive: green,
    itemColorActiveHover: green,
    itemTextColorActiveHover: '#ffffff',
    itemTextColor: '#374151',
    itemTextColorActive: '#ffffff'
  },
  PageHeader: {
    titleTextColor: '#111827'
  }
}