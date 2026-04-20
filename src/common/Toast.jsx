import React, { useEffect } from 'react'

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
                </span>
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    )
}

export default Toast