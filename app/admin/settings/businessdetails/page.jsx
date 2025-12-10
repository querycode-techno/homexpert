"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useImageUpload } from '@/hooks/useImageUpload'
import { Loader2, Save, Upload, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export default function BusinessDetailsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    phone: '',
    whatsapp: '',
    email: '',
    paymentQrCode: '',
    paymentUpiId: ''
  })
  const [logoPreview, setLogoPreview] = useState('')
  const [qrPreview, setQrPreview] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [qrFile, setQrFile] = useState(null)

  const { uploadImage, uploading: uploadingLogo, uploadProgress: logoProgress } = useImageUpload({
    subfolder: 'business-settings'
  })

  const { uploadImage: uploadQr, uploading: uploadingQr, uploadProgress: qrProgress } = useImageUpload({
    subfolder: 'business-settings'
  })

  // Fetch existing settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings/businessdetails')
      const data = await response.json()

      if (data.success) {
        setFormData({
          name: data.data.name || '',
          logo: data.data.logo || '',
          phone: data.data.phone || '',
          whatsapp: data.data.whatsapp || '',
          email: data.data.email || '',
          paymentQrCode: data.data.paymentQrCode || '',
          paymentUpiId: data.data.paymentUpiId || ''
        })
        setLogoPreview(data.data.logo || '')
        setQrPreview(data.data.paymentQrCode || '')
      } else {
        toast.error('Failed to fetch business settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error fetching business settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Handle logo upload
  const handleLogoSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setLogoPreview(e.target.result)
      reader.readAsDataURL(file)
      
      // Upload immediately
      const result = await uploadImage(file)
      if (result.success) {
        setFormData(prev => ({ ...prev, logo: result.file.publicUrl }))
        setLogoPreview(result.file.publicUrl)
        setLogoFile(null)
      }
    }
  }

  // Handle QR code upload
  const handleQrSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setQrFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setQrPreview(e.target.result)
      reader.readAsDataURL(file)
      
      // Upload immediately
      const result = await uploadQr(file)
      if (result.success) {
        setFormData(prev => ({ ...prev, paymentQrCode: result.file.publicUrl }))
        setQrPreview(result.file.publicUrl)
        setQrFile(null)
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSaving(true)

      // Save settings (images are already uploaded on select)
      const response = await fetch('/api/admin/settings/businessdetails', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          logo: formData.logo,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          email: formData.email,
          paymentQrCode: formData.paymentQrCode,
          paymentUpiId: formData.paymentUpiId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Business settings saved successfully')
        setLogoFile(null)
        setQrFile(null)
        fetchSettings() // Refresh to get updated data
      } else {
        toast.error(data.error || 'Failed to save business settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving business settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-start flex-col gap-2 pb-8">
        <h1 className="text-2xl font-bold">Business Details</h1>
        <p className="text-muted-foreground">Manage your business information and contact details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>
            Update your business information that will be visible to vendors and customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter business name"
                required
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Business Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain border rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => {
                        setLogoPreview('')
                        setFormData(prev => ({ ...prev, logo: '' }))
                        setLogoFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    disabled={uploadingLogo}
                    className="cursor-pointer"
                  />
                  {uploadingLogo && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading logo...</span>
                        <span className="text-muted-foreground ml-auto">{logoProgress || 0}%</span>
                      </div>
                      <Progress value={logoProgress || 0} className="h-2" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your business logo (PNG, JPG, WebP)
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="Enter WhatsApp number (optional)"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>

            {/* Payment QR Code */}
            <div className="space-y-2">
              <Label>Payment QR Code</Label>
              <div className="flex items-center gap-4">
                {qrPreview && (
                  <div className="relative">
                    <img
                      src={qrPreview}
                      alt="QR Code preview"
                      className="h-32 w-32 object-contain border rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => {
                        setQrPreview('')
                        setFormData(prev => ({ ...prev, paymentQrCode: '' }))
                        setQrFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleQrSelect}
                    disabled={uploadingQr}
                    className="cursor-pointer"
                  />
                  {uploadingQr && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading QR code...</span>
                        <span className="text-muted-foreground ml-auto">{qrProgress || 0}%</span>
                      </div>
                      <Progress value={qrProgress || 0} className="h-2" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload payment QR code (PNG, JPG, WebP)
                  </p>
                </div>
              </div>
            </div>

            {/* Payment UPI ID */}
            <div className="space-y-2">
              <Label htmlFor="paymentUpiId">Payment UPI ID</Label>
              <Input
                id="paymentUpiId"
                value={formData.paymentUpiId}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentUpiId: e.target.value }))}
                placeholder="example@upi"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving || uploadingLogo || uploadingQr}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

