import styles from './ErrorMessage.module.css'

export default function ErrorMessage({ message, type = 'error', onRetry }) {
  const getIcon = () => {
    switch (type) {
      case 'timeout':
        return '⏱️'
      case 'network':
        return '🌐'
      case 'server':
        return '🔧'
      default:
        return '⚠️'
    }
  }

  const getActionText = () => {
    switch (type) {
      case 'timeout':
        return 'O servidor demorou para responder'
      case 'network':
        return 'Verifique sua conexão com a internet'
      case 'server':
        return 'Problema temporário no servidor'
      default:
        return 'Erro inesperado'
    }
  }

  return (
    <div className={`${styles.errorContainer} ${styles[type]}`}>
      <div className={styles.errorIcon}>{getIcon()}</div>
      <div className={styles.errorContent}>
        <div className={styles.errorMessage}>{message}</div>
        <div className={styles.errorAction}>{getActionText()}</div>
        {onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  )
}
