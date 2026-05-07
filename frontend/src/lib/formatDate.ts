export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }
  
  export const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-BD', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
