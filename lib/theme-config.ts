/**
 * Global Theme Configuration
 * White theme with black primary buttons
 */

export const theme = {
  colors: {
    // Backgrounds
    background: 'bg-white',
    cardBg: 'bg-gray-50',
    cardBgHover: 'bg-gray-100',
    
    // Borders
    border: 'border-gray-200',
    borderHover: 'border-gray-300',
    
    // Text
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-400',
      inverse: 'text-white',
    },
    
    // Buttons
    button: {
      primary: 'bg-black hover:bg-gray-800 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      ghost: 'hover:bg-gray-100 text-gray-700',
    },
    
    // Inputs
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black',
    
    // Status badges
    status: {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    
    // Tables
    table: {
      header: 'bg-gray-100 border-b border-gray-200',
      row: 'hover:bg-gray-50 border-b border-gray-100',
      cell: 'text-gray-900',
      cellSecondary: 'text-gray-600',
    },
  },
  
  // Component-specific styles
  components: {
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    modal: 'bg-white rounded-lg shadow-xl border border-gray-200',
    dropdown: 'bg-white border border-gray-200 rounded-lg shadow-lg',
    tooltip: 'bg-gray-900 text-white text-xs rounded px-2 py-1',
  },
}

// Helper function to get button classes
export function getButtonClasses(variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' = 'primary') {
  return `${theme.colors.button[variant]} px-4 py-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900`
}

// Helper function to get input classes
export function getInputClasses() {
  return `${theme.colors.input} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 w-full`
}

// Helper function to get card classes
export function getCardClasses() {
  return theme.components.card
}

// Helper function to get status badge classes
export function getStatusBadgeClasses(status: 'success' | 'warning' | 'error' | 'info' | 'neutral') {
  return `${theme.colors.status[status]} px-2 py-1 rounded text-xs font-semibold border`
}

