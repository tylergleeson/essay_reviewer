'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type Draft = {
  id: string
  content: string
  versionNumber: number
  wordCount: number
  createdAt: string
}

interface DraftComparisonProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drafts: Draft[]
  currentVersion: number
}

export function DraftComparison({
  open,
  onOpenChange,
  drafts,
  currentVersion,
}: DraftComparisonProps) {
  const [leftVersion, setLeftVersion] = useState<number | null>(null)
  const [rightVersion, setRightVersion] = useState<number | null>(null)

  // Set default versions when dialog opens
  useEffect(() => {
    if (open && drafts.length >= 2) {
      const sortedDrafts = [...drafts].sort((a, b) => b.versionNumber - a.versionNumber)
      setRightVersion(sortedDrafts[0].versionNumber) // Latest
      setLeftVersion(sortedDrafts[1].versionNumber) // Previous
    } else if (open && drafts.length === 1) {
      setRightVersion(drafts[0].versionNumber)
      setLeftVersion(null)
    }
  }, [open, drafts])

  const leftDraft = drafts.find(d => d.versionNumber === leftVersion)
  const rightDraft = drafts.find(d => d.versionNumber === rightVersion)

  const diff = useMemo(() => {
    if (!leftDraft || !rightDraft) return null
    return computeDiff(leftDraft.content, rightDraft.content)
  }, [leftDraft, rightDraft])

  const wordCountChange = useMemo(() => {
    if (!leftDraft || !rightDraft) return 0
    return rightDraft.wordCount - leftDraft.wordCount
  }, [leftDraft, rightDraft])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Drafts</DialogTitle>
          <DialogDescription>
            See changes between draft versions
          </DialogDescription>
        </DialogHeader>

        {/* Version Selectors */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <Select
              value={leftVersion?.toString() || ''}
              onValueChange={(v) => setLeftVersion(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {drafts
                  .filter(d => d.versionNumber !== rightVersion)
                  .sort((a, b) => b.versionNumber - a.versionNumber)
                  .map(draft => (
                    <SelectItem key={draft.id} value={draft.versionNumber.toString()}>
                      v{draft.versionNumber}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-gray-400">→</span>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <Select
              value={rightVersion?.toString() || ''}
              onValueChange={(v) => setRightVersion(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {drafts
                  .filter(d => d.versionNumber !== leftVersion)
                  .sort((a, b) => b.versionNumber - a.versionNumber)
                  .map(draft => (
                    <SelectItem key={draft.id} value={draft.versionNumber.toString()}>
                      v{draft.versionNumber}
                      {draft.versionNumber === currentVersion && ' (current)'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          {leftDraft && rightDraft && (
            <div className="ml-auto flex items-center gap-4 text-sm">
              <Badge variant="outline">
                {leftDraft.wordCount} → {rightDraft.wordCount} words
                <span className={wordCountChange >= 0 ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                  ({wordCountChange >= 0 ? '+' : ''}{wordCountChange})
                </span>
              </Badge>
              {diff && (
                <Badge variant="outline">
                  <span className="text-green-600">+{diff.additions}</span>
                  {' / '}
                  <span className="text-red-600">-{diff.deletions}</span>
                  {' changes'}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Diff View */}
        <div className="flex-1 overflow-auto">
          {!leftDraft || !rightDraft ? (
            <div className="text-center py-12 text-gray-500">
              {drafts.length < 2
                ? 'Only one draft exists. Submit revisions to compare versions.'
                : 'Select two versions to compare'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4">
              {/* Left (Previous) */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="outline">v{leftVersion}</Badge>
                  <span className="text-gray-500">{formatDate(leftDraft.createdAt)}</span>
                </div>
                <div className="bg-red-50 border border-red-100 rounded p-4 font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                  {diff?.leftContent}
                </div>
              </div>

              {/* Right (Current) */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="outline">v{rightVersion}</Badge>
                  {rightVersion === currentVersion && (
                    <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                  )}
                  <span className="text-gray-500">{formatDate(rightDraft.createdAt)}</span>
                </div>
                <div className="bg-green-50 border border-green-100 rounded p-4 font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                  {diff?.rightContent}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unified Diff View */}
        {diff && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Unified Changes</h3>
            <div className="bg-gray-50 border rounded p-4 font-mono text-sm max-h-48 overflow-y-auto">
              {diff.unified.map((line, i) => (
                <div
                  key={i}
                  className={`${
                    line.type === 'add'
                      ? 'bg-green-100 text-green-800'
                      : line.type === 'remove'
                      ? 'bg-red-100 text-red-800'
                      : ''
                  }`}
                >
                  <span className="select-none text-gray-400 mr-2">
                    {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                  </span>
                  {line.content}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simple diff algorithm for comparing drafts
function computeDiff(
  oldText: string,
  newText: string
): {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
  unified: { type: 'add' | 'remove' | 'same'; content: string }[]
  additions: number
  deletions: number
} {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  // Simple line-by-line diff
  const unified: { type: 'add' | 'remove' | 'same'; content: string }[] = []
  let additions = 0
  let deletions = 0

  // Use LCS algorithm for better diff
  const lcs = computeLCS(oldLines, newLines)

  let oldIndex = 0
  let newIndex = 0

  for (const match of lcs) {
    // Add deletions
    while (oldIndex < match.oldIndex) {
      unified.push({ type: 'remove', content: oldLines[oldIndex] })
      deletions++
      oldIndex++
    }

    // Add additions
    while (newIndex < match.newIndex) {
      unified.push({ type: 'add', content: newLines[newIndex] })
      additions++
      newIndex++
    }

    // Add same line
    unified.push({ type: 'same', content: oldLines[oldIndex] })
    oldIndex++
    newIndex++
  }

  // Add remaining deletions
  while (oldIndex < oldLines.length) {
    unified.push({ type: 'remove', content: oldLines[oldIndex] })
    deletions++
    oldIndex++
  }

  // Add remaining additions
  while (newIndex < newLines.length) {
    unified.push({ type: 'add', content: newLines[newIndex] })
    additions++
    newIndex++
  }

  // Create rendered content with highlights
  const leftContent = unified
    .filter(l => l.type !== 'add')
    .map((line, i) => (
      <div
        key={i}
        className={line.type === 'remove' ? 'bg-red-200 -mx-4 px-4' : ''}
      >
        {line.content || '\u00A0'}
      </div>
    ))

  const rightContent = unified
    .filter(l => l.type !== 'remove')
    .map((line, i) => (
      <div
        key={i}
        className={line.type === 'add' ? 'bg-green-200 -mx-4 px-4' : ''}
      >
        {line.content || '\u00A0'}
      </div>
    ))

  return { leftContent, rightContent, unified, additions, deletions }
}

// Compute Longest Common Subsequence for line matching
function computeLCS(
  oldLines: string[],
  newLines: string[]
): { oldIndex: number; newIndex: number }[] {
  const m = oldLines.length
  const n = newLines.length

  // Build LCS table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find matches
  const matches: { oldIndex: number; newIndex: number }[] = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      matches.unshift({ oldIndex: i - 1, newIndex: j - 1 })
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return matches
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
