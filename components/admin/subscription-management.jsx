"use client"

import { useState } from "react"
import { SubscriptionList } from "@/components/admin/subscription/subscription-list"
import { SubscriptionForm } from "@/components/admin/subscription/subscription-form"

export function SubscriptionManagement() {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setIsFormOpen(true)
  }

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedPlan(null)
  }

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    handleFormClose()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">
          Create and manage subscription plans for vendors.
        </p>
      </div>

      <SubscriptionList 
        onCreatePlan={handleCreatePlan}
        onEditPlan={handleEditPlan}
        refreshTrigger={refreshTrigger}
      />

      {/* Subscription Form Modal/Dialog */}
      {isFormOpen && (
        <SubscriptionForm
          plan={selectedPlan}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
