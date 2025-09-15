"use client"

import { useEffect, useCallback, useRef } from "react"

export interface KeyboardShortcut {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  category: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") {
        return
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
        const metaMatches = !!shortcut.metaKey === event.metaKey
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey
        const altMatches = !!shortcut.altKey === event.altKey

        if (keyMatches && metaMatches && ctrlMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.action()
          break
        }
      }
    },
    [enabled],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

export function useGmailShortcuts(actions: {
  compose: () => void
  reply: () => void
  replyAll: () => void
  forward: () => void
  archive: () => void
  star: () => void
  snooze: () => void
  delete: () => void
  markRead: () => void
  markUnread: () => void
  goToInbox: () => void
  goToSent: () => void
  goToDrafts: () => void
  goToStarred: () => void
  goToArchive: () => void
  search: () => void
  commandPalette: () => void
  nextMessage: () => void
  prevMessage: () => void
  openMessage: () => void
  selectMessage: () => void
  refresh: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Composition
    {
      key: "c",
      action: actions.compose,
      description: "Compose new email",
      category: "Composition",
    },
    {
      key: "r",
      action: actions.reply,
      description: "Reply to email",
      category: "Composition",
    },
    {
      key: "a",
      action: actions.replyAll,
      description: "Reply all",
      category: "Composition",
    },
    {
      key: "f",
      action: actions.forward,
      description: "Forward email",
      category: "Composition",
    },

    // Actions
    {
      key: "e",
      action: actions.archive,
      description: "Archive email",
      category: "Actions",
    },
    {
      key: "s",
      action: actions.star,
      description: "Star/unstar email",
      category: "Actions",
    },
    {
      key: "b",
      action: actions.snooze,
      description: "Snooze email",
      category: "Actions",
    },
    {
      key: "#",
      action: actions.delete,
      description: "Delete email",
      category: "Actions",
    },
    {
      key: "i",
      shiftKey: true,
      action: actions.markRead,
      description: "Mark as read",
      category: "Actions",
    },
    {
      key: "u",
      shiftKey: true,
      action: actions.markUnread,
      description: "Mark as unread",
      category: "Actions",
    },

    // Navigation
    {
      key: "j",
      action: actions.nextMessage,
      description: "Next message",
      category: "Navigation",
    },
    {
      key: "k",
      action: actions.prevMessage,
      description: "Previous message",
      category: "Navigation",
    },
    {
      key: "ArrowDown",
      action: actions.nextMessage,
      description: "Next message",
      category: "Navigation",
    },
    {
      key: "ArrowUp",
      action: actions.prevMessage,
      description: "Previous message",
      category: "Navigation",
    },
    {
      key: "Enter",
      action: actions.openMessage,
      description: "Open message",
      category: "Navigation",
    },
    {
      key: "o",
      action: actions.openMessage,
      description: "Open message",
      category: "Navigation",
    },
    {
      key: "x",
      action: actions.selectMessage,
      description: "Select message",
      category: "Navigation",
    },

    // Go to shortcuts (two-key combinations)
    {
      key: "i",
      action: actions.goToInbox,
      description: "Go to Inbox (after G)",
      category: "Go To",
    },
    {
      key: "s",
      action: actions.goToSent,
      description: "Go to Sent (after G)",
      category: "Go To",
    },
    {
      key: "d",
      action: actions.goToDrafts,
      description: "Go to Drafts (after G)",
      category: "Go To",
    },
    {
      key: "*",
      action: actions.goToStarred,
      description: "Go to Starred (after G)",
      category: "Go To",
    },
    {
      key: "a",
      action: actions.goToArchive,
      description: "Go to Archive (after G)",
      category: "Go To",
    },

    // Search and commands
    {
      key: "/",
      action: actions.search,
      description: "Search emails",
      category: "Search",
    },
    {
      key: "k",
      metaKey: true,
      action: actions.commandPalette,
      description: "Command palette",
      category: "Search",
    },
    {
      key: "k",
      ctrlKey: true,
      action: actions.commandPalette,
      description: "Command palette",
      category: "Search",
    },

    // Utility
    {
      key: "r",
      metaKey: true,
      action: actions.refresh,
      description: "Refresh",
      category: "Utility",
    },
    {
      key: "F5",
      action: actions.refresh,
      description: "Refresh",
      category: "Utility",
    },
  ]

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}

// Two-key shortcut handler (like Gmail's "g then i")
export function useTwoKeyShortcuts(shortcuts: Record<string, Record<string, () => void>>) {
  const firstKeyRef = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") {
        return
      }

      const key = event.key.toLowerCase()

      // Clear timeout on any key press
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (firstKeyRef.current) {
        // Second key pressed
        const firstKey = firstKeyRef.current
        firstKeyRef.current = null

        if (shortcuts[firstKey] && shortcuts[firstKey][key]) {
          event.preventDefault()
          shortcuts[firstKey][key]()
        }
      } else if (shortcuts[key]) {
        // First key pressed
        event.preventDefault()
        firstKeyRef.current = key

        // Reset after 2 seconds
        timeoutRef.current = setTimeout(() => {
          firstKeyRef.current = null
          timeoutRef.current = null
        }, 2000)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [shortcuts])

  return firstKeyRef.current
}
