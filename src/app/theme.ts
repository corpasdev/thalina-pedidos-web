import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * Paleta de marca: dorado, verde esmeralda y crema.
 * La misma paleta se organiza en una variante clara y una oscura.
 */
export const palette = {
  brand: {
    gold: '#FFD700',
    goldSoft: '#FFEFB0',
    green: '#00A86B',
    greenHoverDark: '#2ED5A0',
    greenPressed: '#008A59',
    cream: '#F5F5DC'
  },
  surfaceDark: {
    page: '#111827',
    card: '#1f2937',
    border: '#374151',
    borderSoft: '#1f2937',
    sider: '#0b1220',
    tableHeader: '#1e293b',
    input: '#111827'
  },
  surfaceLight: {
    page: '#F5F5DC',
    card: '#ffffff',
    border: '#e5e7eb',
    borderSoft: '#f3f4f6',
    sider: '#ffffff',
    tableHeader: '#F5F5DC',
    input: '#ffffff'
  },
  textDark: {
    base: '#F5F5DC',
    soft: '#E5E7EB',
    muted: '#9CA3AF'
  },
  textLight: {
    base: '#111827',
    soft: '#374151',
    muted: '#6b7280'
  }
} as const

export const gold = palette.brand.gold
export const green = palette.brand.green
export const cream = palette.brand.cream

export const brand = green
export const brandDark = palette.brand.greenPressed

/** Tema oscuro de Naive UI con acento verde esmeralda (marca tienda). */
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: green,
    primaryColorHover: palette.brand.greenHoverDark,
    primaryColorPressed: brandDark,
    primaryColorSuppl: brand,
    infoColor: '#58C0E8',
    successColor: green,
    warningColor: gold,
    errorColor: '#F87171',
    borderRadius: '10px',
    bodyColor: palette.surfaceDark.page,
    cardColor: palette.surfaceDark.card,
    modalColor: palette.surfaceDark.card,
    popoverColor: palette.surfaceDark.card,
    tableColor: palette.surfaceDark.page,
    inputColor: palette.surfaceDark.input,
    textColorBase: palette.textDark.base,
    textColor1: palette.textDark.base,
    textColor2: palette.textDark.soft,
    textColor3: palette.textDark.muted
  },
  Card: {
    color: palette.surfaceDark.card,
    borderColor: palette.surfaceDark.border
  },
  DataTable: {
    thColor: palette.surfaceDark.tableHeader,
    tdColor: palette.surfaceDark.page,
    thTextColor: palette.textDark.base,
    tdTextColor: palette.textDark.soft
  },
  Layout: {
    siderColor: palette.surfaceDark.sider,
    headerColor: palette.surfaceDark.sider,
    color: palette.surfaceDark.page
  },
  Menu: {
    itemColorActive: green,
    itemColorActiveHover: green,
    itemTextColorActiveHover: palette.textDark.base,
    itemTextColor: '#D1D5DB',
    itemTextColorActive: palette.textDark.base
  },
  PageHeader: {
    titleTextColor: palette.textDark.base
  }
}

/** Variante clara de la misma paleta: fondos crema/blanco con texto grafito. */
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
    bodyColor: palette.surfaceLight.page,
    cardColor: palette.surfaceLight.card,
    modalColor: palette.surfaceLight.card,
    popoverColor: palette.surfaceLight.card,
    tableColor: palette.surfaceLight.card,
    inputColor: palette.surfaceLight.input,
    textColorBase: palette.textLight.base,
    textColor1: palette.textLight.base,
    textColor2: palette.textLight.soft,
    textColor3: palette.textLight.muted
  },
  Card: {
    color: palette.surfaceLight.card,
    borderColor: palette.surfaceLight.border
  },
  DataTable: {
    thColor: palette.surfaceLight.tableHeader,
    tdColor: palette.surfaceLight.card,
    thTextColor: palette.textLight.base,
    tdTextColor: palette.textLight.soft
  },
  Layout: {
    siderColor: palette.surfaceLight.sider,
    headerColor: palette.surfaceLight.sider,
    color: palette.surfaceLight.page
  },
  Menu: {
    itemColorActive: green,
    itemColorActiveHover: green,
    itemTextColorActiveHover: '#ffffff',
    itemTextColor: palette.textLight.soft,
    itemTextColorActive: '#ffffff'
  },
  PageHeader: {
    titleTextColor: palette.textLight.base
  }
}