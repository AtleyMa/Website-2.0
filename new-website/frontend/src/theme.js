// SodaKid Custom Theme for Ant Design
// Colors extracted from existing design

export const colors = {
  // Primary colors
  primary: '#87CCD9',       // Cyan/Teal - rgb(135, 204, 217)
  primaryHover: '#6bb8c6',
  primaryActive: '#5aa9b7',
  
  // Secondary colors
  secondary: '#B8CF37',     // Lime green - rgb(184, 207, 55)
  secondaryHover: '#a3b82f',
  secondaryActive: '#8fa127',
  
  // Accent colors
  blue: '#0480DE',          // Blue canister color
  pink: '#EB058C',          // Pink canister color
  
  // Neutral colors
  background: '#f8f9fa',
  white: '#ffffff',
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e8e8e8',
  
  // Status colors
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
}

export const theme = {
  token: {
    // Brand colors
    colorPrimary: colors.primary,
    colorPrimaryHover: colors.primaryHover,
    colorPrimaryActive: colors.primaryActive,
    colorPrimaryBg: 'rgba(135, 204, 217, 0.1)',
    colorPrimaryBgHover: 'rgba(135, 204, 217, 0.2)',
    
    // Link colors
    colorLink: colors.primary,
    colorLinkHover: colors.primaryHover,
    colorLinkActive: colors.primaryActive,
    
    // Success colors (using secondary/lime)
    colorSuccess: colors.success,
    
    // Background colors
    colorBgContainer: colors.white,
    colorBgLayout: colors.background,
    colorBgBase: colors.background,
    
    // Text colors
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textMuted,
    
    // Border
    colorBorder: colors.border,
    colorBorderSecondary: '#f0f0f0',
    
    // Typography
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // Box shadow
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.12)',
    
    // Layout
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },
  components: {
    Button: {
      primaryShadow: '0 2px 8px rgba(135, 204, 217, 0.4)',
      defaultBorderColor: colors.black,
      fontWeight: 500,
    },
    Card: {
      paddingLG: 24,
      borderRadiusLG: 16,
      boxShadowTertiary: '0 4px 24px rgba(0, 0, 0, 0.08)',
    },
    Input: {
      activeBorderColor: colors.primary,
      hoverBorderColor: colors.primaryHover,
      activeShadow: '0 0 0 2px rgba(135, 204, 217, 0.2)',
    },
    Menu: {
      itemHoverBg: 'rgba(135, 204, 217, 0.1)',
      itemSelectedBg: 'rgba(135, 204, 217, 0.2)',
      itemSelectedColor: colors.textPrimary,
    },
    Layout: {
      headerBg: colors.white,
      bodyBg: colors.background,
      footerBg: colors.white,
    },
    Typography: {
      titleMarginBottom: '0.5em',
      titleMarginTop: 0,
    },
    Table: {
      headerBg: 'rgba(135, 204, 217, 0.1)',
      rowHoverBg: 'rgba(135, 204, 217, 0.05)',
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Message: {
      contentBg: colors.white,
    },
  },
}

export default theme
