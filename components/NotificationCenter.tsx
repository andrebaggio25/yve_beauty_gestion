'use client'

import { useState } from 'react'
import { Bell, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-black hover:text-gray-700 font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`} />
                          <h4 className="text-gray-900 text-sm font-medium">{notification.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        <p className="text-gray-400 text-xs">
                          {notification.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        {notification.actionUrl && notification.actionLabel && (
                          <Link
                            href={notification.actionUrl}
                            onClick={() => {
                              markAsRead(notification.id)
                              setIsOpen(false)
                            }}
                            className="text-black hover:text-gray-700 text-xs flex items-center gap-1 font-medium"
                          >
                            <ExternalLink size={12} />
                            {notification.actionLabel}
                          </Link>
                        )}
                        <button
                          onClick={() => dismiss(notification.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
