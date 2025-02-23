"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { User, Calendar, Phone, Mail, MapPin, PenLine } from "lucide-react"

interface UserProfile {
  name: string
  email: string
  phone: string
  address: string | null
  pincode: string | null
  createdAt: string
}

export default function UserProfile() {
  const { user: authUser, setUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }

        const data = await response.json()
        setProfile(data.user)
        setEditedProfile({
          name: data.user.name,
          phone: data.user.phone,
          address: data.user.address || "",
          pincode: data.user.pincode || "",
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editedProfile),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const { user: updatedUser } = await response.json()
      setProfile(updatedUser)
      setUser(prev => ({
        ...prev!,
        name: updatedUser.name
      }))
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditedProfile({
        name: profile.name,
        phone: profile.phone,
        address: profile.address || "",
        pincode: profile.pincode || "",
      })
    }
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/50">
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your personal information and contact details</p>
        </div>
        <Button 
          onClick={handleEdit}
          variant="outline"
          size="sm"
          className="text-[#3C5A3E] border-[#3C5A3E] hover:bg-[#3C5A3E] hover:text-white transition-colors"
        >
          <PenLine className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-6 p-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] overflow-hidden">
            {/* Profile Header with Brand Color */}
            <div className="bg-[#3C5A3E] p-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="mt-3 text-lg font-medium text-white">{profile.name}</h2>
                <p className="text-white/70">{profile.email}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500 block">Member Since</span>
                    <div className="text-gray-900 font-medium">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500 block">Contact</span>
                    <div className="text-gray-900 font-medium">{profile.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]">
          <div className="p-6 border-b">
            <h3 className="text-base font-medium text-gray-900">Personal Information</h3>
            <p className="text-sm text-gray-500 mt-0.5">Update your personal details and contact information</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                </div>
                {isEditing ? (
                  <Input
                    value={editedProfile.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full border-gray-200 focus:border-[#3C5A3E] focus:ring-[#3C5A3E]"
                  />
                ) : (
                  <div className="text-sm text-gray-900 py-2">{profile.name}</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-600">Email</label>
                </div>
                <div className="text-sm text-gray-900 py-2">{profile.email}</div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                </div>
                {isEditing ? (
                  <Input
                    value={editedProfile.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full border-gray-200 focus:border-[#3C5A3E] focus:ring-[#3C5A3E]"
                  />
                ) : (
                  <div className="text-sm text-gray-900 py-2">{profile.phone}</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-600">Address</label>
                </div>
                {isEditing ? (
                  <Input
                    value={editedProfile.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full border-gray-200 focus:border-[#3C5A3E] focus:ring-[#3C5A3E]"
                    placeholder="Enter your address"
                  />
                ) : (
                  <div className="text-sm text-gray-900 py-2">
                    {profile.address || "Not provided"}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-600">Pincode</label>
                </div>
                {isEditing ? (
                  <Input
                    value={editedProfile.pincode || ""}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    className="w-full border-gray-200 focus:border-[#3C5A3E] focus:ring-[#3C5A3E]"
                    placeholder="Enter your pincode"
                  />
                ) : (
                  <div className="text-sm text-gray-900 py-2">
                    {profile.pincode || "Not provided"}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 