"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, RefreshCw, ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ErrorDetails {
  error: string
  details?: string
  debug?: any
  timestamp?: string
  status?: number
  url?: string
  method?: string
}

interface ErrorDialogProps {
  isOpen: boolean
  onClose: () => void
  error: ErrorDetails | null
  onRetry?: () => void
}

export function ErrorDialog({ isOpen, onClose, error, onRetry }: ErrorDialogProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Error details copied successfully",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const getErrorIcon = (status?: number) => {
    if (!status) return <AlertTriangle className="h-5 w-5 text-red-500" />
    if (status >= 200 && status < 300) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (status >= 400 && status < 500) return <XCircle className="h-5 w-5 text-orange-500" />
    if (status >= 500) return <AlertTriangle className="h-5 w-5 text-red-500" />
    return <AlertTriangle className="h-5 w-5 text-gray-500" />
  }

  const getErrorSeverity = (status?: number) => {
    if (!status) return "error"
    if (status >= 200 && status < 300) return "success"
    if (status >= 400 && status < 500) return "warning"
    if (status >= 500) return "error"
    return "info"
  }

  if (!error) return null

  const errorText = JSON.stringify(error, null, 2)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getErrorIcon(error.status)}
            Authentication Error
          </DialogTitle>
          <DialogDescription>
            Something went wrong during the authentication process. Here are the details:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Summary */}
          <Alert variant={getErrorSeverity(error.status) as any}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{error.error}</strong>
              {error.details && (
                <div className="mt-1 text-sm opacity-90">{error.details}</div>
              )}
            </AlertDescription>
          </Alert>

          {/* Error Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Error Details</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(errorText)}
                  disabled={copied}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs font-mono overflow-x-auto">
              <pre>{errorText}</pre>
            </div>
          </div>

          {/* Debug Information */}
          {error.debug && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Debug Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(error.debug).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {key}
                    </Badge>
                    <span className="text-sm">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Information */}
          {(error.url || error.method || error.status) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Request Information</h4>
              <div className="space-y-1 text-sm">
                {error.method && error.url && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{error.method}</Badge>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {error.url}
                    </code>
                  </div>
                )}
                {error.status && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Status:</span>
                    <Badge variant={getErrorSeverity(error.status) as any}>
                      {error.status}
                    </Badge>
                  </div>
                )}
                {error.timestamp && (
                  <div className="text-xs text-gray-500">
                    {new Date(error.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Troubleshooting Tips</h4>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Check if your Supabase database tables are set up correctly</li>
              <li>• Verify Google OAuth is configured in Supabase Dashboard</li>
              <li>• Ensure environment variables are set in Vercel</li>
              <li>• Check browser console for additional error messages</li>
              <li>• Try the demo account first to test basic functionality</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onRetry && (
              <Button onClick={onRetry}>
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.open('/api/debug/supabase-config', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Debug Config
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
