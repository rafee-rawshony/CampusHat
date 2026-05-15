'use client'

import React from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', background: '#FAFAFA' }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                }}>
                    <div style={{ maxWidth: '420px', textAlign: 'center' }}>
                        {/* Logo */}
                        <div style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            color: '#4C3B8A',
                            marginBottom: '2rem',
                            letterSpacing: '-0.5px',
                        }}>
                            Campus<span style={{ color: '#1A1A2E' }}>Hat</span>
                        </div>

                        {/* Error Icon */}
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #FEF2F2, #FFF7ED)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            border: '1px solid #FEE2E2',
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>

                        <h1 style={{
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '0.75rem',
                        }}>
                            Something went wrong
                        </h1>

                        <p style={{
                            fontSize: '14px',
                            color: '#6B7280',
                            lineHeight: 1.7,
                            marginBottom: '2rem',
                        }}>
                            A critical error occurred. Please try refreshing the page.
                            If the issue persists, contact support.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '12px 28px',
                                    background: '#4C3B8A',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 4px 12px rgba(76, 59, 138, 0.25)',
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = '#3D2F6E')}
                                onMouseOut={e => (e.currentTarget.style.background = '#4C3B8A')}
                            >
                                Try Again
                            </button>
                            <a
                                href="/"
                                style={{
                                    padding: '12px 28px',
                                    background: 'white',
                                    color: '#374151',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.borderColor = '#4C3B8A40'
                                    e.currentTarget.style.background = '#F9FAFB'
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.borderColor = '#E5E7EB'
                                    e.currentTarget.style.background = 'white'
                                }}
                            >
                                Go Home
                            </a>
                        </div>

                        {error?.digest && (
                            <p style={{
                                marginTop: '2rem',
                                fontSize: '11px',
                                color: '#9CA3AF',
                                fontFamily: 'monospace',
                            }}>
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                </div>
            </body>
        </html>
    )
}
