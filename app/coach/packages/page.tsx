'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { toast } from 'sonner'

type Package = {
  id: string
  name: string
  reviewCredits: number
  priceInCents: number
  isActive: boolean
  createdAt: string
  _count?: {
    studentCoaches: number
  }
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    reviewCredits: '',
    price: '',
    isActive: true,
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const reviewCredits = parseInt(formData.reviewCredits)
    const priceInCents = Math.round(parseFloat(formData.price) * 100)

    if (isNaN(reviewCredits) || reviewCredits < 1) {
      toast.error('Review credits must be at least 1')
      return
    }

    if (isNaN(priceInCents) || priceInCents < 0) {
      toast.error('Price must be a valid number')
      return
    }

    try {
      const url = editingId ? `/api/packages/${editingId}` : '/api/packages'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          reviewCredits,
          priceInCents,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast.success(editingId ? 'Package updated' : 'Package created')
        setDialogOpen(false)
        setFormData({ name: '', reviewCredits: '', price: '', isActive: true })
        setEditingId(null)
        fetchPackages()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save package')
      }
    } catch (error) {
      console.error('Error saving package:', error)
      toast.error('An error occurred')
    }
  }

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setFormData({
      name: pkg.name,
      reviewCredits: pkg.reviewCredits.toString(),
      price: (pkg.priceInCents / 100).toFixed(2),
      isActive: pkg.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) {
      return
    }

    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Package deleted')
        fetchPackages()
      } else {
        toast.error('Failed to delete package')
      }
    } catch (error) {
      console.error('Error deleting package:', error)
      toast.error('An error occurred')
    }
  }

  const toggleActive = async (pkg: Package) => {
    try {
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !pkg.isActive,
        }),
      })

      if (response.ok) {
        toast.success(`Package ${!pkg.isActive ? 'activated' : 'deactivated'}`)
        fetchPackages()
      } else {
        toast.error('Failed to update package')
      }
    } catch (error) {
      console.error('Error updating package:', error)
      toast.error('An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing Packages</h1>
            <p className="text-sm text-gray-600">Manage your coaching packages and pricing</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/coach">Back to Dashboard</Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ name: '', reviewCredits: '', price: '', isActive: true })
                  }}
                >
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Package' : 'Create Package'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? 'Update the package details below.'
                      : 'Create a new pricing package for students.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Starter Package"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewCredits">Number of Reviews</Label>
                    <Input
                      id="reviewCredits"
                      type="number"
                      min="1"
                      value={formData.reviewCredits}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewCredits: e.target.value })
                      }
                      placeholder="e.g., 3"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="e.g., 149.99"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="isActive" className="font-normal cursor-pointer">
                      Active (visible to students)
                    </Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {packages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Packages Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first pricing package to start working with students.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                Create Your First Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Packages</CardTitle>
              <CardDescription>
                {packages.filter(p => p.isActive).length} active package
                {packages.filter(p => p.isActive).length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.reviewCredits} reviews</TableCell>
                      <TableCell>${(pkg.priceInCents / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {pkg._count?.studentCoaches ?? 0} purchased
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(pkg)}
                          >
                            {pkg.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pkg)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(pkg.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
