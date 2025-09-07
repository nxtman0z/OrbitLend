import React from 'react'
import ProfileInfo from '../components/profile/ProfileInfo'
import { WalletConnection } from '../components/profile/WalletConnection'
import { SecuritySettings } from '../components/profile/SecuritySettings'

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account information, security settings, and preferences.
          </p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info - Takes full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2">
            <ProfileInfo />
          </div>

          {/* Wallet Connection - Sidebar on desktop */}
          <div className="lg:col-span-1">
            <WalletConnection />
          </div>

          {/* Security Settings - Full width */}
          <div className="lg:col-span-3">
            <SecuritySettings />
          </div>
        </div>
      </div>
    </div>
  )
}
