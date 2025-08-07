'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import GlassCard from '@/components/ui/glass-card'
import LoadingSpinner from '@/components/ui/loading'
import Breadcrumb from '@/components/ui/breadcrumb'
import { motion } from 'framer-motion'
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react'

interface ApiKey {
  id: string
  key_name: string
  api_key: string
  permissions: string[]
  is_active: boolean
  last_used: string | null
  expires_at: string | null
  created_at: string
}

export default function ApiKeysPage() {
  const { user } = useUser()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read'])
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newCreatedKey, setNewCreatedKey] = useState<{ key: string; name: string } | null>(null)

  const breadcrumbItems = [
    { label: 'Home', icon: '🏠', onClick: () => window.location.href = '/' },
    { label: 'API Keys', icon: '🔑', isActive: true }
  ]

  const fetchApiKeys = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || []) // Changed from data.keys to data.apiKeys
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  const createApiKey = async () => {
    if (!newKeyName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyName: newKeyName, // Changed from key_name to keyName
          permissions: newKeyPermissions
        })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchApiKeys()
        setNewKeyName('')
        setNewKeyPermissions(['read'])
        setShowNewKeyForm(false)

        // Show the API key in a modal/alert with copy functionality
        showApiKeyModal(data.key, newKeyName)
      } else {
        const error = await response.json()
        alert(`Failed to create API key: ${error.error || error.message}`)
      }
    } catch {
      alert('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const deleteApiKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete \"${keyName}\"?`)) return

    try {
      const response = await fetch(`/api/api-keys?keyId=${keyId}&action=delete`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId))
        alert('API key deleted successfully')
      } else {
        alert('Failed to delete API key')
      }
    } catch {
      alert('Failed to delete API key')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      // First try the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        alert('API key copied to clipboard!')
        return
      }

      // Fallback method for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        alert('API key copied to clipboard!')
      } else {
        throw new Error('Copy command failed')
      }
    } catch (error) {
      console.error('Copy failed:', error)
      // Show the text in a prompt as last resort
      prompt('Copy this API key manually:', text)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  const showApiKeyModal = (apiKey: string, keyName: string) => {
    setNewCreatedKey({ key: apiKey, name: keyName })
    setShowKeyModal(true)
  }

  const closeKeyModal = () => {
    setShowKeyModal(false)
    setNewCreatedKey(null)
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute inset-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="relative z-20 px-6 pt-32 pb-16">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Key className="w-8 h-8" />
              API Key Management
            </h1>
            <p className="text-white/70">
              Create and manage API keys for programmatic access to your storage
            </p>
          </div>

          {/* Create New Key Button */}
          <div className="flex justify-end mb-6">
            <motion.button
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              Create New API Key
            </motion.button>
          </div>

          {/* Create New Key Form */}
          {showNewKeyForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Create New API Key</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Mobile App Key"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      {['read', 'write', 'delete'].map((permission) => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newKeyPermissions.includes(permission)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyPermissions([...newKeyPermissions, permission])
                              } else {
                                setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-white/80 capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={createApiKey}
                      disabled={creating || !newKeyName.trim()}
                      className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create Key'}
                    </button>
                    <button
                      onClick={() => setShowNewKeyForm(false)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* API Keys List */}
          <GlassCard>
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Your API Keys</h2>
              <p className="text-white/60 text-sm mt-1">
                {apiKeys.length} {apiKeys.length === 1 ? 'key' : 'keys'} created
              </p>
            </div>

            {loading ? (
              <div className="p-12">
                <LoadingSpinner size="md" message="Loading API keys..." />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-16 px-6">
                <Key className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No API keys yet</h3>
                <p className="text-white/60 text-sm">Create your first API key to get started with programmatic access</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {apiKeys.map((apiKey, index) => (
                  <motion.div
                    key={apiKey.id}
                    className="p-6 hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-white">{apiKey.key_name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            apiKey.is_active 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {apiKey.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <code className="px-2 py-1 bg-black/50 rounded text-sm text-white/80 font-mono">
                            {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                          >
                            {visibleKeys.has(apiKey.id) ?
                              <EyeOff className="w-4 h-4 text-white/60" /> :
                              <Eye className="w-4 h-4 text-white/60" />
                            }
                          </button>
                          <button
                            onClick={() => copyToClipboard(apiKey.api_key)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4 text-white/60" />
                          </button>
                        </div>

                        <div className="text-sm text-white/60 space-y-1">
                          <p>Permissions: {apiKey.permissions.join(', ')}</p>
                          <p>Created: {formatDate(apiKey.created_at)}</p>
                          {apiKey.last_used && <p>Last used: {formatDate(apiKey.last_used)}</p>}
                          {apiKey.expires_at && <p>Expires: {formatDate(apiKey.expires_at)}</p>}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteApiKey(apiKey.id, apiKey.key_name)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete API key"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* API Key Created Modal */}
          {showKeyModal && newCreatedKey && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg"
              >
                {/* Glass Card Container */}
                <div className="relative rounded-xl border border-white/20 bg-black/40 backdrop-blur-md shadow-2xl">
                  {/* Gradient Background Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                  {/* Content */}
                  <div className="relative p-8">
                    {/* Success Icon */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30">
                        <Key className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        API Key Created Successfully!
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Your API key <span className="text-white font-medium">&quot;{newCreatedKey.name}&quot;</span> has been created.
                      </p>
                    </div>

                    {/* Warning Banner */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-400 text-xs font-bold">!</span>
                        </div>
                        <div>
                          <p className="text-amber-300 text-sm font-medium mb-1">
                            Important Security Notice
                          </p>
                          <p className="text-amber-200/90 text-xs leading-relaxed">
                            This is the only time you&apos;ll see the full key. Save it securely - you won&apos;t be able to view it again after closing this modal.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* API Key Display */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white/80 mb-3">
                        Your API Key:
                      </label>
                      <div className="relative">
                        <div className="flex items-center gap-3 p-4 bg-black/60 border border-white/20 rounded-lg backdrop-blur-sm">
                          <code className="flex-1 text-sm text-white font-mono break-all leading-relaxed">
                            {newCreatedKey.key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(newCreatedKey.key)}
                            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200 hover:scale-105 flex-shrink-0"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(newCreatedKey.key)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Key
                      </button>
                      <button
                        onClick={closeKeyModal}
                        className="px-6 py-3 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 font-medium"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
