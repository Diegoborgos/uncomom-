"use client"

import Link from "next/link"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  icon_url: string | null
  action_url: string | null
  read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  arrival: "\u{1F6EC}",
  follow: "\u{1F465}",
  nearby: "\u{1F4CD}",
  city_update: "\u{1F4CA}",
  briefing: "\u{1F4EC}",
  system: "\u2726",
}

export default function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const icon = TYPE_ICONS[notification.type] || "\u{1F514}"

  const handleClick = () => {
    if (!notification.read) onRead(notification.id)
  }

  const content = (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
        notification.read
          ? "hover:bg-[var(--surface)]"
          : "bg-[rgb(var(--accent-green-rgb)/0.05)] hover:bg-[rgb(var(--accent-green-rgb)/0.1)]"
      }`}
    >
      {/* Icon/Avatar */}
      {notification.icon_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={notification.icon_url}
          alt=""
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <span className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-sm shrink-0">
          {icon}
        </span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notification.read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
          {getTimeAgo(new Date(notification.created_at))}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] shrink-0 mt-2" />
      )}
    </div>
  )

  if (notification.action_url) {
    return <Link href={notification.action_url}>{content}</Link>
  }
  return content
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}
